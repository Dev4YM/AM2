/** Lead shapes aligned with AM2 SQLite schema (Drizzle `leads` table). */

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export interface LeadRecord {
  id: string;
  userId: string;
  externalId?: string | null;
  name: string;
  category?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  hours?: string | null;
  status: LeadStatus;
  territoryId?: string | null;
  enriched?: boolean;
  reviewsJson?: string | null;
  smartSalesJson?: string | null;
  emailsJson?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadImportRow {
  name: string;
  category?: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  email?: string;
  website?: string;
  externalId?: string;
}

export interface LeadImportPayload {
  rows: LeadImportRow[];
  skipDuplicates?: boolean;
}
