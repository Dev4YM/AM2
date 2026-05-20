import { Injectable, OnModuleInit } from "@nestjs/common";
import type { QualifiedBusinessProfile } from "@am2/shared";
import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";

@Injectable()
export class QualifiedDataCacheService implements OnModuleInit {
  private db!: Database.Database;

  onModuleInit() {
    const dbPath =
      process.env.QUALIFIED_DATA_CACHE_PATH ??
      path.join(process.cwd(), "data", "qualified-data-cache.sqlite");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS qualified_profiles (
        place_id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  get(placeId: string): QualifiedBusinessProfile | null {
    const row = this.db
      .prepare(`SELECT payload FROM qualified_profiles WHERE place_id = ?`)
      .get(placeId) as { payload: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.payload) as QualifiedBusinessProfile;
  }

  set(profile: QualifiedBusinessProfile): void {
    this.db
      .prepare(
        `INSERT INTO qualified_profiles (place_id, payload, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(place_id) DO UPDATE SET
           payload = excluded.payload,
           updated_at = excluded.updated_at`,
      )
      .run(profile.placeId, JSON.stringify(profile), profile.enrichedAt);
  }

  merge(
    placeId: string,
    patch: Partial<QualifiedBusinessProfile>,
  ): QualifiedBusinessProfile {
    const existing = this.get(placeId);
    const tiersCompleted = [
      ...new Set([
        ...(existing?.tiersCompleted ?? []),
        ...(patch.tiersCompleted ?? []),
      ]),
    ];
    const merged: QualifiedBusinessProfile = {
      ...existing,
      ...patch,
      placeId,
      enrichedAt: patch.enrichedAt ?? new Date().toISOString(),
      tiersCompleted,
    };
    this.set(merged);
    return merged;
  }
}
