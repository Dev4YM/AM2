import { Injectable, Logger } from "@nestjs/common";
import type { BusinessDataTier, EnrichedDataTier } from "@am2/shared";
import { domainFromWebsite, extractContactsFromHtml } from "@am2/shared";
import type { EnrichmentProvider } from "./enrichment.collector";

@Injectable()
export class WebsiteScrapeProvider implements EnrichmentProvider {
  readonly name = "website_scrape";
  private readonly logger = new Logger(WebsiteScrapeProvider.name);

  async enrich(business: BusinessDataTier): Promise<Partial<EnrichedDataTier>> {
    if (!business.website) return {};

    const url = business.website.startsWith("http")
      ? business.website
      : `https://${business.website}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "AM2-BusinessFinder/1.0 (+https://github.com/Dev4YM/AM2)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (!res.ok) return {};
      const html = await res.text();
      const scraped = extractContactsFromHtml(html, url);

      return {
        emails: scraped.emails.length ? scraped.emails : null,
        mobilePhones: scraped.mobilePhones.length ? scraped.mobilePhones : null,
        socialLinks: scraped.socialLinks.length ? scraped.socialLinks : null,
        whatsapp: scraped.whatsapp,
      };
    } catch (e) {
      this.logger.warn(`Scrape failed for ${url}: ${e instanceof Error ? e.message : e}`);
      return {};
    }
  }
}
