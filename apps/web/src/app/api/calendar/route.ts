import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import {
  getOwnedLead,
  isSession,
  requireSession,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  leadId: z.string().nullable().optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const events = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, session.user.id));

  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { title, description, leadId } = parsed.data;

  if (leadId) {
    const lead = await getOwnedLead(session.user.id, leadId);
    if (!lead) {
      return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }
  }

  const startsAt = parsed.data.startsAt ?
    new Date(parsed.data.startsAt)
  : new Date();
  const endsAt = parsed.data.endsAt ?
    new Date(parsed.data.endsAt)
  : new Date(startsAt.getTime() + 60 * 60 * 1000);

  const now = new Date();
  const id = uuid();

  await db.insert(calendarEvents).values({
    id,
    userId: session.user.id,
    leadId: leadId ?? null,
    title,
    description: description ?? null,
    startsAt,
    endsAt,
    createdAt: now,
  });

  return NextResponse.json({ id });
}
