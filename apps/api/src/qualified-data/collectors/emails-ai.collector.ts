import { Injectable } from "@nestjs/common";
import type {
  BusinessDataTier,
  SmartEmailDraft,
  SmartEmailsTier,
  SmartReviewsTier,
  SmartSalesTier,
} from "@am2/shared";
import { CollectorMetricsService } from "../../reputation/collector-metrics.service";
import { getOpenAiClient, openAiModel } from "./openai.client";

@Injectable()
export class EmailsAiCollector {
  constructor(private readonly metrics: CollectorMetricsService) {}

  async collect(
    business: BusinessDataTier,
    reviews: SmartReviewsTier | null,
    sales: SmartSalesTier | null,
    crmContext: string | undefined,
    count: number,
  ): Promise<SmartEmailsTier> {
    const started = Date.now();
    const draftCount = Math.min(3, Math.max(1, count));
    const openai = getOpenAiClient();

    if (openai) {
      try {
        const prompt = `Write ${draftCount} short, personalized B2B cold email drafts for "${business.name}".

Business: ${JSON.stringify(business)}
Review summary: ${reviews?.summary ?? "n/a"}
Pain points: ${(reviews?.painPoints ?? []).join("; ")}
Sales angle: ${sales?.prospectingAngle ?? "n/a"}
Opportunities: ${(sales?.opportunities ?? []).join("; ")}
${crmContext ? `Our company / CRM context: ${crmContext}` : ""}

Return JSON: { "drafts": [{ "subject": string, "body": string, "tone": string }] }
Keep each email under 150 words. Vary tone across drafts (consultative, direct, value-led).`;

        const res = await openai.chat.completions.create({
          model: openAiModel(),
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = res.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as {
            drafts?: SmartEmailDraft[];
            emails?: SmartEmailDraft[];
          };
          const drafts = (parsed.drafts ?? parsed.emails ?? []).slice(0, draftCount);
          if (drafts.length > 0) {
            this.metrics.record({
              collector: "emails_ai",
              success: true,
              durationMs: Date.now() - started,
              fieldsPopulated: drafts.length,
            });
            return {
              drafts,
              crmContextUsed: crmContext ?? null,
              generationSource: "openai",
            };
          }
        }
      } catch (e) {
        this.metrics.record({
          collector: "emails_ai",
          success: false,
          durationMs: Date.now() - started,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const drafts = this.templateDrafts(business, reviews, crmContext, draftCount);
    this.metrics.record({
      collector: "emails_ai",
      success: true,
      durationMs: Date.now() - started,
      fieldsPopulated: drafts.length,
    });
    return {
      drafts,
      crmContextUsed: crmContext ?? null,
      generationSource: "template",
    };
  }

  private templateDrafts(
    business: BusinessDataTier,
    reviews: SmartReviewsTier | null,
    crmContext: string | undefined,
    count: number,
  ): SmartEmailDraft[] {
    const pain = reviews?.painPoints?.[0] ?? "day-to-day operational friction";
    const offer = crmContext || "targeted improvements for businesses like yours";
    const tones = ["consultative", "direct", "value-led"] as const;

    return Array.from({ length: count }, (_, i) => ({
      subject: `Quick idea for ${business.name}`,
      body: `Hi,\n\nI noticed customers at ${business.name} often mention ${pain}. We help ${business.category} operators with ${offer}.\n\nWould a 10-minute call this week work?\n\nBest regards`,
      tone: tones[i % tones.length],
    }));
  }
}
