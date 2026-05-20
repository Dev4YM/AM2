import { Injectable } from "@nestjs/common";
import type { BusinessDataTier, PlaceReview, SmartReviewsTier } from "@am2/shared";
import { CollectorMetricsService } from "../../reputation/collector-metrics.service";
import { getOpenAiClient, openAiModel } from "./openai.client";

@Injectable()
export class ReviewsAiCollector {
  constructor(private readonly metrics: CollectorMetricsService) {}

  async collect(
    business: BusinessDataTier,
    reviews: PlaceReview[],
    crmContext?: string,
  ): Promise<SmartReviewsTier> {
    const started = Date.now();
    const avg =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : null;

    const openai = getOpenAiClient();
    if (openai && reviews.length > 0) {
      try {
        const prompt = `Analyze customer reviews for "${business.name}" (${business.category}).
${crmContext ? `Seller context: ${crmContext}` : ""}
Reviews: ${JSON.stringify(reviews.slice(0, 20))}
Return JSON: { "summary": string, "sentiment": "positive"|"mixed"|"negative", "themes": string[], "painPoints": string[], "strengths": string[] }`;

        const res = await openai.chat.completions.create({
          model: openAiModel(),
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = res.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as {
            summary?: string;
            sentiment?: SmartReviewsTier["sentiment"];
            themes?: string[];
            painPoints?: string[];
            strengths?: string[];
          };

          const tier: SmartReviewsTier = {
            reviews,
            averageRating: avg,
            reviewCount: reviews.length,
            summary: parsed.summary ?? this.heuristicSummary(business.name, reviews, avg),
            sentiment: parsed.sentiment ?? this.heuristicSentiment(avg),
            themes: parsed.themes ?? [],
            painPoints: parsed.painPoints ?? [],
            strengths: parsed.strengths ?? [],
            analysisSource: "openai",
          };

          this.metrics.record({
            collector: "reviews_ai",
            success: true,
            durationMs: Date.now() - started,
            fieldsPopulated: 5,
          });
          return tier;
        }
      } catch (e) {
        this.metrics.record({
          collector: "reviews_ai",
          success: false,
          durationMs: Date.now() - started,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const tier = this.heuristic(business.name, reviews, avg);
    this.metrics.record({
      collector: "reviews_ai",
      success: true,
      durationMs: Date.now() - started,
      fieldsPopulated: reviews.length > 0 ? 3 : 1,
    });
    return tier;
  }

  private heuristic(
    businessName: string,
    reviews: PlaceReview[],
    avg: number | null,
  ): SmartReviewsTier {
    const low = reviews.filter((r) => r.rating <= 2);
    const high = reviews.filter((r) => r.rating >= 4);
    return {
      reviews,
      averageRating: avg,
      reviewCount: reviews.length,
      summary: this.heuristicSummary(businessName, reviews, avg),
      sentiment: this.heuristicSentiment(avg),
      themes: ["service quality", "value", "location"],
      painPoints: low
        .slice(0, 3)
        .map((r) => r.text.slice(0, 120) || "Negative experience reported"),
      strengths:
        high.length > 0
          ? high.slice(0, 2).map((r) => r.text.slice(0, 80) || "Positive feedback")
          : ["Established local presence"],
      analysisSource: "heuristic",
    };
  }

  private heuristicSummary(
    name: string,
    reviews: PlaceReview[],
    avg: number | null,
  ): string {
    if (reviews.length === 0) {
      return `${name} has no public Google reviews available for analysis.`;
    }
    return `${name} has ${reviews.length} sampled reviews with an average rating of ${avg?.toFixed(1) ?? "n/a"}. Themes include service, value, and consistency.`;
  }

  private heuristicSentiment(avg: number | null): SmartReviewsTier["sentiment"] {
    if (avg == null) return "unknown";
    if (avg >= 4) return "positive";
    if (avg >= 3) return "mixed";
    return "negative";
  }
}
