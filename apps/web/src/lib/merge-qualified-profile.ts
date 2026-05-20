import type { QualifiedBusinessProfile } from "@/lib/qualified-data-api";

/** Merge a partial enrichment response into an existing cached profile. */
export function mergeQualifiedProfiles(
  existing: QualifiedBusinessProfile | undefined,
  incoming: QualifiedBusinessProfile,
): QualifiedBusinessProfile {
  const tiersCompleted = [
    ...new Set([
      ...(existing?.tiersCompleted ?? []),
      ...(incoming.tiersCompleted ?? []),
    ]),
  ];

  return {
    ...existing,
    ...incoming,
    placeId: incoming.placeId,
    tiersCompleted,
    tiersRequested: incoming.tiersRequested ?? existing?.tiersRequested,
    enrichedAt: incoming.enrichedAt ?? existing?.enrichedAt,
    businessData: incoming.businessData ?? existing?.businessData ?? null,
    enrichedData: incoming.enrichedData ?? existing?.enrichedData ?? null,
    smartReviews: incoming.smartReviews ?? existing?.smartReviews ?? null,
    smartSales: incoming.smartSales ?? existing?.smartSales ?? null,
    smartEmails: incoming.smartEmails ?? existing?.smartEmails ?? null,
  };
}

/** Tiers still needed for the current selection. */
export function tiersPendingEnrichment(
  selected: Iterable<string>,
  profile: QualifiedBusinessProfile | undefined,
): string[] {
  const done = new Set(profile?.tiersCompleted ?? []);
  return [...selected].filter((t) => !done.has(t));
}
