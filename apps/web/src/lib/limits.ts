/** Self-hosted OSS defaults — no paid tiers or capacity gates. */
export const OSS_LIMITS = {
  leadCapacity: 10_000,
  smartReviewsPerMonth: 1_000,
  smartEmailsPerLead: 10,
  teamMembers: 50,
  savedRoutes: 100,
} as const;
