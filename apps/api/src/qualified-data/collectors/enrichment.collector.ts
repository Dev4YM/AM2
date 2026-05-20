import { Injectable, OnModuleInit } from "@nestjs/common";
import type { BusinessDataTier, EnrichedDataTier } from "@am2/shared";
import { CollectorMetricsService } from "../../reputation/collector-metrics.service";
import { HunterProvider } from "./hunter.provider";
import { WebsiteScrapeProvider } from "./website-scrape.provider";

export interface EnrichmentProvider {
  name: string;
  enrich(business: BusinessDataTier): Promise<Partial<EnrichedDataTier>>;
}

@Injectable()
export class EnrichmentCollector implements OnModuleInit {
  private readonly providers: EnrichmentProvider[] = [];

  constructor(
    private readonly metrics: CollectorMetricsService,
    private readonly websiteScrape: WebsiteScrapeProvider,
    private readonly hunter: HunterProvider,
  ) {}

  onModuleInit() {
    this.registerProvider(this.websiteScrape);
    this.registerProvider(this.hunter);
  }

  registerProvider(provider: EnrichmentProvider): void {
    this.providers.push(provider);
  }

  async collect(business: BusinessDataTier): Promise<EnrichedDataTier> {
    const started = Date.now();
    const collectorsAttempted: string[] = [];

    let emails: string[] = [];
    let mobilePhones: string[] = [];
    let socialLinks: NonNullable<EnrichedDataTier["socialLinks"]> = [];
    let whatsapp: string | null = null;

    const merge = (partial: Partial<EnrichedDataTier>) => {
      if (partial.emails?.length) {
        emails = [...new Set([...emails, ...partial.emails])];
      }
      if (partial.mobilePhones?.length) {
        mobilePhones = [...new Set([...mobilePhones, ...partial.mobilePhones])];
      }
      if (partial.socialLinks?.length) {
        const map = new Map<string, { platform: string; url: string }>();
        for (const s of [...socialLinks, ...partial.socialLinks]) {
          map.set(`${s.platform}:${s.url}`, s);
        }
        socialLinks = [...map.values()];
      }
      if (partial.whatsapp) whatsapp = partial.whatsapp;
    };

    for (const provider of this.providers) {
      collectorsAttempted.push(provider.name);
      try {
        merge(await provider.enrich(business));
      } catch {
        /* best-effort */
      }
    }

    const hasAny =
      emails.length > 0 ||
      mobilePhones.length > 0 ||
      socialLinks.length > 0 ||
      Boolean(whatsapp);

    const status: EnrichedDataTier["enrichmentStatus"] = hasAny
      ? emails.length > 0 && (mobilePhones.length > 0 || socialLinks.length > 0)
        ? "complete"
        : "partial"
      : "stub";

    this.metrics.record({
      collector: "enrichment",
      success: hasAny,
      durationMs: Date.now() - started,
      fieldsPopulated: hasAny ? 1 : 0,
    });

    return {
      emails: emails.length ? emails : null,
      mobilePhones: mobilePhones.length ? mobilePhones : null,
      socialLinks: socialLinks.length ? socialLinks : null,
      whatsapp,
      enrichmentStatus: status,
      collectorsAttempted,
    };
  }
}
