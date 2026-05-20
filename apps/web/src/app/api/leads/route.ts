import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { requireSession, isSession } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { getCatalogBusiness } from "@/lib/business-catalog";
import { getGooglePlaceDetails } from "@/lib/google-places";
import { OSS_LIMITS } from "@/lib/limits";

const placeSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.userId, session.user.id));

  return NextResponse.json({ leads: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await req.json();
  const catalogIds: string[] = body.catalogIds ?? [];
  const placeIds: { placeId: string }[] = body.places ?? [];

  const existing = await db
    .select()
    .from(leads)
    .where(eq(leads.userId, session.user.id));

  const totalNew = catalogIds.length + placeIds.length;
  if (existing.length + totalNew > OSS_LIMITS.leadCapacity) {
    return NextResponse.json(
      { error: `Lead capacity exceeded (${OSS_LIMITS.leadCapacity})` },
      { status: 400 },
    );
  }

  const existingExternal = new Set(
    existing.map((l) => l.externalId).filter(Boolean) as string[],
  );

  const now = new Date();
  const imported: string[] = [];
  let skipped = 0;

  for (const catalogId of catalogIds) {
    const biz = getCatalogBusiness(catalogId);
    if (!biz) continue;

    if (existingExternal.has(biz.id)) {
      skipped++;
      continue;
    }

    const id = uuid();
    await db.insert(leads).values({
      id,
      userId: session.user.id,
      externalId: biz.id,
      name: biz.name,
      category: biz.category,
      address: `${biz.address}, ${biz.city}`,
      lat: biz.lat,
      lng: biz.lng,
      phone: biz.phone,
      mobile: biz.mobile,
      email: biz.email,
      website: biz.website,
      rating: biz.rating,
      reviewCount: biz.reviewCount,
      hours: biz.hours,
      enriched: Boolean(biz.email || biz.mobile),
      reviewsJson: biz.reviews ? JSON.stringify(biz.reviews) : null,
      createdAt: now,
      updatedAt: now,
    });
    imported.push(id);
    existingExternal.add(biz.id);
  }

  for (const raw of placeIds) {
    const parsed = placeSchema.safeParse(raw);
    if (!parsed.success) continue;

    const externalId = `google:${parsed.data.placeId}`;
    if (existingExternal.has(externalId)) {
      skipped++;
      continue;
    }

    const details = await getGooglePlaceDetails(parsed.data.placeId);
    if (!details) continue;

    const id = uuid();
    await db.insert(leads).values({
      id,
      userId: session.user.id,
      externalId,
      name: details.name,
      category: details.category,
      address: details.address,
      lat: details.lat,
      lng: details.lng,
      phone: details.phone,
      website: details.website,
      rating: details.rating,
      reviewCount: details.reviewCount,
      enriched: Boolean(details.phone || details.website),
      reviewsJson: details.reviews?.length ? JSON.stringify(details.reviews) : null,
      createdAt: now,
      updatedAt: now,
    });
    imported.push(id);
    existingExternal.add(externalId);
  }

  return NextResponse.json({ imported, skipped });
}
