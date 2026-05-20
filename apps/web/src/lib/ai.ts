import OpenAI from "openai";
import { APP_SHORT } from "@/lib/brand";

const openai =
  process.env.OPENAI_API_KEY?.length ?
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface ReviewInput {
  author: string;
  rating: number;
  text: string;
  date?: string;
}

export async function summarizeReviews(
  businessName: string,
  reviews: ReviewInput[],
  businessContext?: string,
): Promise<{
  summary: string;
  painPoints: string[];
  strengths: string[];
  opportunities: string[];
}> {
  if (openai && reviews.length > 0) {
    const prompt = `Analyze these customer reviews for "${businessName}".
${businessContext ? `Seller context: ${businessContext}` : ""}
Reviews: ${JSON.stringify(reviews.slice(0, 20))}
Return JSON with keys: summary, painPoints (array), strengths (array), opportunities (array).`;

    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
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
  const low = reviews.filter((r) => r.rating <= 2);

  return {
    summary: `${businessName} has ${reviews.length} reviews with an average rating of ${avg.toFixed(1)}. Common themes include service quality and value.`,
    painPoints: low.slice(0, 3).map((r) => r.text.slice(0, 120) || "Slow service reported"),
    strengths: ["Established local presence", "Consistent foot traffic"],
    opportunities: [
      "Address recurring complaints in outreach",
      "Position your offer against top pain points",
    ],
  };
}

export async function generateSmartEmails(
  businessName: string,
  painPoints: string[],
  businessContext: string,
  count: number,
): Promise<{ subject: string; body: string }[]> {
  if (openai) {
    const prompt = `Write ${count} short B2B cold emails for "${businessName}".
Pain points from reviews: ${painPoints.join("; ")}
Our business: ${businessContext}
Return JSON array of {subject, body}.`;

    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = res.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        const emails = parsed.emails ?? parsed;
        if (Array.isArray(emails)) return emails.slice(0, count);
      } catch {
        /* fall through */
      }
    }
  }

  const pain = painPoints[0] ?? "operational inefficiencies";
  return Array.from({ length: count }, () => ({
    subject: `Quick idea for ${businessName}`,
    body: `Hi,\n\nI noticed customers at ${businessName} often mention ${pain}. We help businesses like yours with ${businessContext || "targeted improvements"}.\n\nWould a 10-minute call this week work?\n\nBest,\n${APP_SHORT} User`,
  }));
}

export async function chatAssistant(
  message: string,
  context: string,
): Promise<string> {
  if (openai) {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are ${APP_SHORT} (Area To Monitor) sales assistant. CRM context:\n${context}`,
        },
        { role: "user", content: message },
      ],
    });
    return res.choices[0]?.message?.content ?? "No response.";
  }

  return `Based on your CRM data: ${message.slice(0, 80)}... I can help analyze leads, draft emails, and suggest next steps. Connect OPENAI_API_KEY for full AI responses.`;
}
