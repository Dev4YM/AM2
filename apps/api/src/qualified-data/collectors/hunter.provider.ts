import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { BusinessDataTier, EnrichedDataTier } from "@am2/shared";
import { domainFromWebsite } from "@am2/shared";
import type { EnrichmentProvider } from "./enrichment.collector";

@Injectable()
export class HunterProvider implements EnrichmentProvider {
  readonly name = "hunter_io";
  private readonly logger = new Logger(HunterProvider.name);

  constructor(private readonly config: ConfigService) {}

  async enrich(business: BusinessDataTier): Promise<Partial<EnrichedDataTier>> {
    const apiKey = this.config.get<string>("HUNTER_API_KEY");
    if (!apiKey) return {};

    const domain = domainFromWebsite(business.website);
    if (!domain) return {};

    try {
      const url = new URL("https://api.hunter.io/v2/domain-search");
      url.searchParams.set("domain", domain);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("limit", "5");

      const res = await fetch(url.toString());
      if (!res.ok) return {};

      const data = (await res.json()) as {
        data?: { emails?: { value: string; type?: string }[] };
      };

      const emails =
        data.data?.emails
          ?.map((e) => e.value)
          .filter(Boolean)
          .slice(0, 8) ?? [];

      return emails.length ? { emails } : {};
    } catch (e) {
      this.logger.warn(`Hunter failed: ${e instanceof Error ? e.message : e}`);
      return {};
    }
  }
}
