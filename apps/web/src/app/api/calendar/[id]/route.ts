import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  getOwnedLead,
  isSession,
  requireSession,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  leadId: z.string().nullable().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

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

  if (body.leadId) {
    const lead = await getOwnedLead(session.user.id, body.leadId);
    if (!lead) {
      return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }
  }

  const patch: Record<string, unknown> = {};
  if (body.title != null) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.leadId !== undefined) patch.leadId = body.leadId;
  if (body.startsAt != null) patch.startsAt = new Date(body.startsAt);
  if (body.endsAt != null) patch.endsAt = new Date(body.endsAt);

  await db
    .update(calendarEvents)
    .set(patch)
    .where(
      and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.userId, session.user.id),
      ),
    );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!isSession(session)) return session;
  const { id } = await params;

  await db
    .delete(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.userId, session.user.id),
      ),
    );

  return NextResponse.json({ ok: true });
}
