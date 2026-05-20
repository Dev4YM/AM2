import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { LeadImportPayload, LeadImportRow, LeadRecord } from "@am2/shared";
import { LeadsRepository } from "./leads.repository";

@Injectable()
export class LeadsService {
  constructor(private readonly repo: LeadsRepository) {}

  validateImport(payload: LeadImportPayload): {
    valid: LeadImportRow[];
    invalid: { row: LeadImportRow; reason: string }[];
  } {
    const valid: LeadImportRow[] = [];
    const invalid: { row: LeadImportRow; reason: string }[] = [];

    for (const row of payload.rows) {
      if (!row.name?.trim()) {
        invalid.push({ row, reason: "name is required" });
        continue;
      }
      if (
        typeof row.lat !== "number" ||
        typeof row.lng !== "number" ||
        Number.isNaN(row.lat) ||
        Number.isNaN(row.lng)
      ) {
        invalid.push({ row, reason: "lat/lng must be valid numbers" });
        continue;
      }
      valid.push(row);
    }

    return { valid, invalid };
  }

  importForUser(
    userId: string,
    payload: LeadImportPayload,
  ): { imported: number; skipped: number; ids: string[] } {
    const { valid } = this.validateImport(payload);
    const ids: string[] = [];
    let skipped = 0;

    for (const row of valid) {
      if (payload.skipDuplicates) {
        const dup = this.repo.findDuplicate(userId, row);
        if (dup) {
          skipped++;
          continue;
        }
      }

      const id = randomUUID();
      const now = new Date();
      this.repo.insertLead(userId, row, id, now);
      ids.push(id);
    }

    return { imported: ids.length, skipped, ids };
  }

  listForUser(userId: string): LeadRecord[] {
    return this.repo.listForUser(userId);
  }

  countForUser(userId: string): number {
    return this.repo.countForUser(userId);
  }
}
