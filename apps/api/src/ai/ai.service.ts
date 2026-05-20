import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

export interface ReviewInput {
  author: string;
  rating: number;
  text: string;
  date?: string;
}

@Injectable()
export class AiService {
  private openai: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>("OPENAI_API_KEY");
    this.openai = key?.length ? new OpenAI({ apiKey: key }) : null;
  }

  isConfigured(): boolean {
    return Boolean(this.openai);
  }

  async summarizeReviews(
    businessName: string,
    reviews: ReviewInput[],
    businessContext?: string,
  ) {
    if (this.openai && reviews.length > 0) {
      const prompt = `Analyze these customer reviews for "${businessName}".
${businessContext ? `Seller context: ${businessContext}` : ""}
Reviews: ${JSON.stringify(reviews.slice(0, 20))}
Return JSON with keys: summary, painPoints (array), strengths (array), opportunities (array).`;

      const res = await this.openai.chat.completions.create({
        model: this.config.get<string>("OPENAI_MODEL") ?? "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = res.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          /* fall through */
        }
      }
    }

    const avg =
      reviews.length ?
        reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    return {
      summary: `${businessName} has ${reviews.length} reviews (avg ${avg.toFixed(1)}).`,
      painPoints: ["Service speed", "Pricing transparency"],
      strengths: ["Local presence"],
      opportunities: ["Address top complaints in outreach"],
    };
  }

  async smartSalesPitch(params: {
    businessName: string;
    category?: string;
    sellerContext?: string;
  }) {
    if (this.openai) {
      const res = await this.openai.chat.completions.create({
        model: this.config.get<string>("OPENAI_MODEL") ?? "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Write a short B2B sales opener for "${params.businessName}" (${params.category ?? "business"}).
Seller: ${params.sellerContext ?? "B2B services"}. Return JSON: { hook, valueProp, cta }.`,
          },
        ],
        response_format: { type: "json_object" },
      });
      const content = res.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          /* fall through */
        }
      }
    }

    return {
      hook: `Hi — I noticed ${params.businessName} and thought there might be a fit.`,
      valueProp: "We help similar businesses improve outreach efficiency.",
      cta: "Would you be open to a 10-minute call this week?",
    };
  }

  async smartEmail(params: {
    businessName: string;
    recipientRole?: string;
    intent?: string;
  }) {
    if (this.openai) {
      const res = await this.openai.chat.completions.create({
        model: this.config.get<string>("OPENAI_MODEL") ?? "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Draft a concise B2B email to ${params.businessName}${params.recipientRole ? ` (${params.recipientRole})` : ""}.
Intent: ${params.intent ?? "intro"}. Return JSON: { subject, body }.`,
          },
        ],
        response_format: { type: "json_object" },
      });
      const content = res.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          /* fall through */
        }
      }
    }

    return {
      subject: `Quick idea for ${params.businessName}`,
      body: `Hello,\n\nI wanted to reach out regarding ${params.intent ?? "a potential partnership"}.\n\nBest regards`,
    };
  }
}
