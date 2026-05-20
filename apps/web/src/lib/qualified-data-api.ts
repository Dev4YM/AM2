import type {
  EnrichQualifiedDataRequest,
  QualifiedBusinessProfile,
  QualifiedTierKey,
} from "@am2/shared";

export type {
  QualifiedBusinessProfile,
  QualifiedTierKey,
  SmartEmailDraft,
} from "@am2/shared";

export function enrichQualifiedDataUrl(): string {
  return "/api/qualified-data/enrich";
}

export async function enrichQualifiedData(
  body: EnrichQualifiedDataRequest,
): Promise<QualifiedBusinessProfile> {
  const res = await fetch(enrichQualifiedDataUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `Enrichment failed (${res.status})`;
    try {
      const json = JSON.parse(text) as { message?: string | string[]; error?: string };
      if (json.message) {
        message = Array.isArray(json.message) ? json.message.join(", ") : json.message;
      } else if (json.error) {
        message = json.error;
      }
    } catch {
      /* keep raw */
    }
    throw new Error(message);
  }

  return res.json() as Promise<QualifiedBusinessProfile>;
}

export async function enrichQualifiedDataAsync(
  body: EnrichQualifiedDataRequest,
): Promise<{ jobId: string; status: string }> {
  const res = await fetch("/api/qualified-data/enrich/async", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ jobId: string; status: string }>;
}

export async function getEnrichmentJob(jobId: string) {
  const res = await fetch(`/api/qualified-data/jobs/${jobId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
