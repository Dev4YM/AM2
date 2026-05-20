import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import {
  getOwnedLead,
  isSession,
  LEAD_STATUSES,
  requireSession,
  verifyTerritoryOwned,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { leads, activities } from "@/lib/db/schema";
import {
  summarizeReviews,
  generateSmartEmails,
  type ReviewInput,
} from "@/lib/ai";

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(10000).optional(),
  territoryId: z.string().nullable().optional(),
  action: z.enum(["smart-reviews", "smart-emails"]).optional(),
  businessContext: z.string().max(4000).optional(),
  count: z.number().int().min(1).max(5).optional(),
});

function ownedWhere(userId: string, leadId: string) {
  return and(eq(leads.id, leadId), eq(leads.userId, userId));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!isSession(session)) return session;
  const { id } = await params;

  const lead = await getOwnedLead(session.user.id, id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!isSession(session)) return session;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const body = parsed.data;
  const now = new Date();
  const where = ownedWhere(session.user.id, id);

  if (body.action === "smart-reviews") {
    const lead = await getOwnedLead(session.user.id, id);
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const reviews: ReviewInput[] = lead.reviewsJson ?
      JSON.parse(lead.reviewsJson)
    : [];
    const analysis = await summarizeReviews(
      lead.name,
      reviews,
      body.businessContext,
    );

    await db
      .update(leads)
      .set({
        smartSalesJson: JSON.stringify(analysis),
        updatedAt: now,
      })
      .where(where);

    await db.insert(activities).values({
      id: uuid(),
      userId: session.user.id,
      leadId: id,
      type: "smart-reviews",
      content: "Generated smart sales analysis",
      createdAt: now,
    });

    return NextResponse.json({ analysis });
  }

  if (body.action === "smart-emails") {
    const lead = await getOwnedLead(session.user.id, id);
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sales = lead.smartSalesJson ? JSON.parse(lead.smartSalesJson) : {};
    const painPoints: string[] = sales.painPoints ?? [];
    const emails = await generateSmartEmails(
      lead.name,
      painPoints,
      body.businessContext ?? "",
      body.count ?? 2,
    );

    await db
      .update(leads)
      .set({ emailsJson: JSON.stringify(emails), updatedAt: now })
      .where(where);

    await db.insert(activities).values({
      id: uuid(),
      userId: session.user.id,
      leadId: id,
      type: "smart-emails",
      content: `Generated ${emails.length} email draft(s)`,
      createdAt: now,
    });

    return NextResponse.json({ emails });
  }

  if (body.territoryId) {
    const ok = await verifyTerritoryOwned(session.user.id, body.territoryId);
    if (!ok) {
      return NextResponse.json({ error: "Invalid territory" }, { status: 400 });
    }
  }

  const patch: Record<string, unknown> = { updatedAt: now };
  if (body.status != null) patch.status = body.status;
  if (body.notes != null) patch.notes = body.notes;
  if (body.territoryId !== undefined) patch.territoryId = body.territoryId;

  const existing = await getOwnedLead(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.update(leads).set(patch).where(where);

  if (body.notes != null) {
    await db.insert(activities).values({
      id: uuid(),
      userId: session.user.id,
      leadId: id,
      type: "note",
      content: body.notes.slice(0, 2000),
      createdAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!isSession(session)) return session;
  const { id } = await params;

  const existing = await getOwnedLead(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(leads).where(ownedWhere(session.user.id, id));
  return NextResponse.json({ ok: true });
}
