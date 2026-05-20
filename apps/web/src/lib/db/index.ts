import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { initAm2Schema } from "@am2/shared/db-init";
import { resolveDatabasePath } from "@am2/shared/database-path";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

export function getDbPath() {
  return resolveDatabasePath();
}

export function getSqlite() {
  if (!globalForDb.sqlite) {
    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    globalForDb.sqlite = new Database(dbPath);
    globalForDb.sqlite.pragma("journal_mode = WAL");
    initAm2Schema(globalForDb.sqlite);
  }
  return globalForDb.sqlite;
}

export const db = drizzle(getSqlite(), { schema });
