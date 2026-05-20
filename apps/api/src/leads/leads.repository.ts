import { Injectable } from "@nestjs/common";
import type { LeadImportRow, LeadRecord, LeadStatus } from "@am2/shared";
import { DatabaseService } from "../database/database.service";

type LeadRow = {
  id: string;
  user_id: string;
  external_id: string | null;
  name: string;
  category: string | null;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  hours: string | null;
  status: string;
  territory_id: string | null;
  enriched: number;
  reviews_json: string | null;
  smart_sales_json: string | null;
  emails_json: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

@Injectable()
export class LeadsRepository {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.connection;
  }

  private mapRow(row: LeadRow): LeadRecord {
    return {
      id: row.id,
      userId: row.user_id,
      externalId: row.external_id,
      name: row.name,
      category: row.category,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      phone: row.phone,
      mobile: row.mobile,
      email: row.email,
      website: row.website,
      rating: row.rating,
      reviewCount: row.review_count,
      hours: row.hours,
      status: row.status as LeadStatus,
      territoryId: row.territory_id,
      enriched: Boolean(row.enriched),
      reviewsJson: row.reviews_json,
      smartSalesJson: row.smart_sales_json,
      emailsJson: row.emails_json,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  listForUser(userId: string): LeadRecord[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM leads WHERE user_id = ? ORDER BY updated_at DESC`,
      )
      .all(userId) as LeadRow[];
    return rows.map((r) => this.mapRow(r));
  }

  countForUser(userId: string): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) as c FROM leads WHERE user_id = ?`)
      .get(userId) as { c: number };
    return row.c;
  }

  findDuplicate(
    userId: string,
    row: LeadImportRow,
  ): LeadRecord | undefined {
    if (row.externalId) {
      const byExt = this.db
        .prepare(
          `SELECT * FROM leads WHERE user_id = ? AND external_id = ? LIMIT 1`,
        )
        .get(userId, row.externalId) as LeadRow | undefined;
      if (byExt) return this.mapRow(byExt);
    }

    const byGeo = this.db
      .prepare(
        `SELECT * FROM leads WHERE user_id = ? AND name = ? AND lat = ? AND lng = ? LIMIT 1`,
      )
      .get(userId, row.name, row.lat, row.lng) as LeadRow | undefined;
    return byGeo ? this.mapRow(byGeo) : undefined;
  }

  insertLead(
    userId: string,
    row: LeadImportRow,
    id: string,
    now: Date,
  ): void {
    this.db
      .prepare(
        `INSERT INTO leads (
          id, user_id, external_id, name, category, address, lat, lng,
          phone, email, website, status, enriched, created_at, updated_at
        ) VALUES (
          @id, @userId, @externalId, @name, @category, @address, @lat, @lng,
          @phone, @email, @website, 'new', @enriched, @createdAt, @updatedAt
        )`,
      )
      .run({
        id,
        userId,
        externalId: row.externalId ?? null,
        name: row.name,
        category: row.category ?? null,
        address: row.address ?? null,
        lat: row.lat,
        lng: row.lng,
        phone: row.phone ?? null,
        email: row.email ?? null,
        website: row.website ?? null,
        enriched: row.email || row.phone ? 1 : 0,
        createdAt: now.getTime(),
        updatedAt: now.getTime(),
      });
  }
}
