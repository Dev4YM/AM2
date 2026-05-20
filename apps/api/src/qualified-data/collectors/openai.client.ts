import OpenAI from "openai";

let client: OpenAI | null | undefined;

export function getOpenAiClient(): OpenAI | null {
  if (client !== undefined) return client;
  const key = process.env.OPENAI_API_KEY;
  client = key?.length ? new OpenAI({ apiKey: key }) : null;
  return client;
}

export function openAiModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}
