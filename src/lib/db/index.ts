import fs from "fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

function getDbPath() {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "am2.db");
}

export function getSqlite() {
  if (!globalForDb.sqlite) {
    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    globalForDb.sqlite = new Database(dbPath);
    globalForDb.sqlite.pragma("journal_mode = WAL");
    initSchema(globalForDb.sqlite);
  }
  return globalForDb.sqlite;
}

function initSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      lead_capacity INTEGER NOT NULL DEFAULT 10,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      external_id TEXT,
      name TEXT NOT NULL,
      category TEXT,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      phone TEXT,
      mobile TEXT,
      email TEXT,
      website TEXT,
      rating REAL,
      review_count INTEGER,
      hours TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      territory_id TEXT,
      enriched INTEGER DEFAULT 0,
      reviews_json TEXT,
      smart_sales_json TEXT,
      emails_json TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS territories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      geo_json TEXT NOT NULL,
      assigned_rep_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lead_id TEXT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lead_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      starts_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'rep',
      territory_ids TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saved_routes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      lead_ids TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'driving',
      created_at INTEGER NOT NULL
    );
  `);
  migrate(sqlite);
}

function migrate(sqlite: Database.Database) {
  const cols = sqlite
    .prepare("PRAGMA table_info(users)")
    .all() as { name: string }[];
  if (!cols.some((c) => c.name === "business_context")) {
    sqlite.exec(
      `ALTER TABLE users ADD COLUMN business_context TEXT DEFAULT 'We sell B2B software and services';`,
    );
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

export const db = drizzle(getSqlite(), { schema });
