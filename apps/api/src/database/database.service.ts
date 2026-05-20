import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { initAm2Schema } from "@am2/shared/db-init";
import { resolveDatabasePath } from "@am2/shared/database-path";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly db: Database.Database;
  private readonly dbPath: string;

  constructor() {
    this.dbPath = resolveDatabasePath();
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    this.db = new Database(this.dbPath);
    this.db.pragma("journal_mode = WAL");
    initAm2Schema(this.db);
  }

  get connection(): Database.Database {
    return this.db;
  }

  get sqlitePath(): string {
    return this.dbPath;
  }

  onModuleDestroy() {
    this.db.close();
  }
}
