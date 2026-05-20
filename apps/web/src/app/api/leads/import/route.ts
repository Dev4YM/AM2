import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { OSS_LIMITS } from "@/lib/limits";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        values.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.toLowerCase()] = values[idx]?.replace(/^"|"$/g, "") ?? "";
    });
    rows.push(row);
  }
  return rows;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let rows: Record<string, string>[] = [];

  if (contentType.includes("application/json")) {
    const body = await req.json();
    rows = body.rows ?? [];
  } else {
    const text = await req.text();
    rows = parseCsv(text);
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(leads)
    .where(eq(leads.userId, session.user.id));

  const byExternal = new Map(
    existing.filter((l) => l.externalId).map((l) => [l.externalId!, l.id]),
  );
  const byNameAddr = new Set(
    existing.map((l) => `${l.name}|${l.address ?? ""}`.toLowerCase()),
  );

  const now = new Date();
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.name ?? row.business ?? row.company;
    const lat = parseFloat(row.lat ?? row.latitude ?? "0");
    const lng = parseFloat(row.lng ?? row.longitude ?? "0");
    if (!name || Number.isNaN(lat) || Number.isNaN(lng)) {
      skipped++;
      continue;
    }

    const externalId = row.external_id ?? row.externalid ?? row.id ?? null;
    const address = row.address ?? row.location ?? null;
    const key = `${name}|${address ?? ""}`.toLowerCase();

    if (externalId && byExternal.has(externalId)) {
      skipped++;
      continue;
    }
    if (byNameAddr.has(key)) {
      skipped++;
      continue;
    }

    if (existing.length + imported >= OSS_LIMITS.leadCapacity) {
      return NextResponse.json(
        {
          error: `Capacity limit (${OSS_LIMITS.leadCapacity}) reached`,
          imported,
          skipped,
        },
        { status: 400 },
      );
    }

    const id = uuid();
    await db.insert(leads).values({
      id,
      userId: session.user.id,
      externalId,
      name,
      category: row.category ?? null,
      address,
      lat,
      lng,
      phone: row.phone ?? null,
      mobile: row.mobile ?? null,
      email: row.email ?? null,
      website: row.website ?? null,
      rating: row.rating ? parseFloat(row.rating) : null,
      reviewCount: row.review_count ? parseInt(row.review_count, 10) : null,
      status: row.status ?? "new",
      enriched: Boolean(row.email || row.mobile),
      createdAt: now,
      updatedAt: now,
    });

    if (externalId) byExternal.set(externalId, id);
    byNameAddr.add(key);
    imported++;
  }

  return NextResponse.json({ imported, skipped });
}
