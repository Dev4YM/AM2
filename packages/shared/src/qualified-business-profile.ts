import type { PlaceReview } from "./finder";

/** Tier keys accepted by POST /qualified-data/enrich */
export type QualifiedTierKey =
  | "business"
  | "enriched"
  | "reviews"
  | "sales"
  | "emails";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface OpeningHoursPeriod {
  open?: string;
  close?: string;
}

export interface BusinessDataTier {
  name: string;
  address: string;
  landline?: string | null;
  website?: string | null;
  hours?: string | null;
  category: string;
  coordinates: Coordinates;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  googleMapsUri?: string | null;
  source: "google_places";
}

export interface EnrichedDataTier {
  emails: string[] | null;
  mobilePhones: string[] | null;
  socialLinks: {
    platform: string;
    url: string;
  }[] | null;
  whatsapp?: string | null;
  enrichmentStatus: "stub" | "partial" | "complete";
  collectorsAttempted: string[];
}

export interface SmartReviewsTier {
  reviews: PlaceReview[];
  averageRating: number | null;
  reviewCount: number;
  summary: string;
  sentiment: "positive" | "mixed" | "negative" | "unknown";
  themes: string[];
  painPoints: string[];
  strengths: string[];
  analysisSource: "openai" | "heuristic";
}

export interface SmartSalesTier {
  weaknesses: string[];
  strengths: string[];
  indicators: string[];
  opportunities: string[];
  prospectingAngle: string;
  analysisSource: "openai" | "heuristic";
}

export interface SmartEmailDraft {
  subject: string;
  body: string;
  tone?: string;
}

export interface SmartEmailsTier {
  drafts: SmartEmailDraft[];
  crmContextUsed?: string | null;
  generationSource: "openai" | "template";
}

export interface QualifiedBusinessProfile {
  placeId: string;
  enrichedAt: string;
  tiersCompleted: QualifiedTierKey[];
  tiersRequested?: QualifiedTierKey[];
  businessData?: BusinessDataTier | null;
  enrichedData?: EnrichedDataTier | null;
  smartReviews?: SmartReviewsTier | null;
  smartSales?: SmartSalesTier | null;
  smartEmails?: SmartEmailsTier | null;
}

export interface EnrichQualifiedDataRequest {
  placeId: string;
  tiers: QualifiedTierKey[];
  /** Optional CRM / seller context for AI tiers */
  crmContext?: string;
  /** Number of email drafts (1–3) when smartEmails tier is requested */
  emailDraftCount?: number;
}
