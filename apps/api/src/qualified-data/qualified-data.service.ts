import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  EnrichQualifiedDataRequest,
  QualifiedBusinessProfile,
  QualifiedTierKey,
} from "@am2/shared";
import { QualifiedDataCacheService } from "./cache/qualified-data-cache.service";
import { EmailsAiCollector } from "./collectors/emails-ai.collector";
import { EnrichmentCollector } from "./collectors/enrichment.collector";
import { GooglePlacesCollector } from "./collectors/google-places.collector";
import { ReviewsAiCollector } from "./collectors/reviews-ai.collector";
import { SalesAiCollector } from "./collectors/sales-ai.collector";

const ALL_TIERS: QualifiedTierKey[] = [
  "business",
  "enriched",
  "reviews",
  "sales",
  "emails",
];

@Injectable()
export class QualifiedDataService {
  constructor(
    private readonly cache: QualifiedDataCacheService,
    private readonly googlePlaces: GooglePlacesCollector,
    private readonly enrichment: EnrichmentCollector,
    private readonly reviewsAi: ReviewsAiCollector,
    private readonly salesAi: SalesAiCollector,
    private readonly emailsAi: EmailsAiCollector,
  ) {}

  getCached(placeId: string): QualifiedBusinessProfile {
    const profile = this.cache.get(placeId);
    if (!profile) {
      throw new NotFoundException(
        `No qualified profile cached for placeId: ${placeId}`,
      );
    }
    return profile;
  }

  async enrich(
    request: EnrichQualifiedDataRequest,
  ): Promise<QualifiedBusinessProfile> {
    const tiers = [...new Set(request.tiers)];
    const placeId = request.placeId.replace(/^places\//, "");
    const existing = this.cache.get(placeId);
    const pending = tiers.filter(
      (t) => !(existing?.tiersCompleted ?? []).includes(t),
    );

    if (pending.length === 0 && existing) {
      return {
        ...existing,
        placeId,
        tiersRequested: tiers,
        enrichedAt: existing.enrichedAt ?? new Date().toISOString(),
      };
    }

    const work = pending.length > 0 ? pending : tiers;

    let profile: QualifiedBusinessProfile = {
      ...existing,
      placeId,
      enrichedAt: new Date().toISOString(),
      tiersCompleted: existing?.tiersCompleted ?? [],
      tiersRequested: tiers,
    };

    const needsPlaces = work.some((t) =>
      ["business", "enriched", "reviews", "sales", "emails"].includes(t),
    );

    let placesRaw = null;
    if (needsPlaces) {
      placesRaw = await this.googlePlaces.fetchDetails(placeId);
    }

    if (work.includes("business")) {
      profile.businessData = placesRaw?.businessData ?? null;
      if (profile.businessData) this.markTier(profile, "business");
    }

    const business =
      profile.businessData ?? placesRaw?.businessData ?? null;
    const reviewsList = placesRaw?.reviews ?? [];

    if (work.includes("enriched") && business) {
      profile.enrichedData = await this.enrichment.collect(business);
      this.markTier(profile, "enriched");
    } else if (work.includes("enriched") && !business) {
      profile.enrichedData = {
        emails: null,
        mobilePhones: null,
        socialLinks: null,
        whatsapp: null,
        enrichmentStatus: "stub",
        collectorsAttempted: ["skipped_no_business_data"],
      };
    }

    if (work.includes("reviews") && business) {
      profile.smartReviews = await this.reviewsAi.collect(
        business,
        reviewsList,
        request.crmContext,
      );
      this.markTier(profile, "reviews");
    }

    if (work.includes("sales") && business) {
      profile.smartSales = await this.salesAi.collect(
        business,
        profile.smartReviews ?? null,
        profile.enrichedData ?? null,
        request.crmContext,
      );
      this.markTier(profile, "sales");
    }

    if (work.includes("emails") && business) {
      profile.smartEmails = await this.emailsAi.collect(
        business,
        profile.smartReviews ?? null,
        profile.smartSales ?? null,
        request.crmContext,
        request.emailDraftCount ?? 2,
      );
      this.markTier(profile, "emails");
    }

    profile.enrichedAt = new Date().toISOString();
    this.cache.set(profile);
    return profile;
  }

  async enrichAll(placeId: string, crmContext?: string): Promise<QualifiedBusinessProfile> {
    return this.enrich({
      placeId,
      tiers: ALL_TIERS,
      crmContext,
      emailDraftCount: 2,
    });
  }

  private markTier(profile: QualifiedBusinessProfile, tier: QualifiedTierKey) {
    if (!profile.tiersCompleted.includes(tier)) {
      profile.tiersCompleted.push(tier);
    }
  }
}
