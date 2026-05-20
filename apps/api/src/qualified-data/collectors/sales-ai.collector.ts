import { Injectable } from "@nestjs/common";
import type {
  BusinessDataTier,
  EnrichedDataTier,
  SmartReviewsTier,
  SmartSalesTier,
} from "@am2/shared";
import { CollectorMetricsService } from "../../reputation/collector-metrics.service";
import { getOpenAiClient, openAiModel } from "./openai.client";

@Injectable()
export class SalesAiCollector {
  constructor(private readonly metrics: CollectorMetricsService) {}

  async collect(
    business: BusinessDataTier,
    reviews: SmartReviewsTier | null,
    enriched: EnrichedDataTier | null,
    crmContext?: string,
  ): Promise<SmartSalesTier> {
    const started = Date.now();
    const openai = getOpenAiClient();

    if (openai) {
      try {
        const prompt = `You are a B2B sales intelligence analyst. Build a SWOT-style prospecting brief for a sales rep targeting this business.

Business: ${JSON.stringify(business)}
Review insights: ${JSON.stringify(reviews ?? {})}
Enrichment: ${JSON.stringify(enriched ?? {})}
${crmContext ? `Seller / CRM context: ${crmContext}` : ""}

Return JSON:
{
  "weaknesses": string[],
  "strengths": string[],
  "indicators": string[],
  "opportunities": string[],
  "prospectingAngle": string
}

Focus on actionable B2B outreach: operational gaps, growth signals, competitive pressure, and timing indicators.`;

        const res = await openai.chat.completions.create({
          model: openAiModel(),
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = res.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as Partial<SmartSalesTier>;
          const tier: SmartSalesTier = {
            weaknesses: parsed.weaknesses ?? [],
            strengths: parsed.strengths ?? [],
            indicators: parsed.indicators ?? [],
            opportunities: parsed.opportunities ?? [],
            prospectingAngle:
              parsed.prospectingAngle ??
              `Position your offer against top pain points at ${business.name}.`,
            analysisSource: "openai",
          };
          this.metrics.record({
            collector: "sales_ai",
            success: true,
            durationMs: Date.now() - started,
            fieldsPopulated: 5,
          });
          return tier;
        }
      } catch (e) {
        this.metrics.record({
          collector: "sales_ai",
          success: false,
          durationMs: Date.now() - started,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const tier = this.heuristic(business, reviews);
    this.metrics.record({
      collector: "sales_ai",
      success: true,
      durationMs: Date.now() - started,
      fieldsPopulated: 4,
    });
    return tier;
  }

  private heuristic(
    business: BusinessDataTier,
    reviews: SmartReviewsTier | null,
  ): SmartSalesTier {
    const pain = reviews?.painPoints ?? [];
    const rating = business.rating;
    return {
      weaknesses: [
        ...(pain.slice(0, 2).length ? pain.slice(0, 2) : ["Limited public digital footprint"]),
        rating != null && rating < 4 ? "Below-average Google rating" : "Unknown competitive moat",
      ],
      strengths: [
        business.category ? `Active ${business.category} operator` : "Operating business",
        business.reviewCount && business.reviewCount > 20
          ? "Meaningful review volume — engaged customer base"
          : "Local market presence",
      ],
      indicators: [
        business.website ? "Has website — digitized operations" : "No website on file",
        business.hours ? "Published hours — likely staffed location" : "Hours unknown",
      ],
      opportunities: [
        ...(reviews?.themes?.slice(0, 2).map((t) => `Address theme: ${t}`) ?? []),
        "Offer efficiency or reputation improvement aligned with review pain points",
        "Multi-location or franchise expansion pitch if indicators suggest growth",
      ],
      prospectingAngle: `Lead with how you solve "${pain[0] ?? "operational friction"}" for similar ${business.category} businesses.`,
      analysisSource: "heuristic",
    };
  }
}
