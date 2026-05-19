import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import {
  getOwnedLead,
  isSession,
  requireSession,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";

const createSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(["note", "call", "visit", "email", "smart-reviews", "smart-emails"]).default("note"),
  leadId: z.string().nullable().optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.userId, session.user.id))
    .orderBy(desc(activities.createdAt))
    .limit(100);

  return NextResponse.json({ activities: rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { content, type, leadId } = parsed.data;

  if (leadId) {
    const lead = await getOwnedLead(session.user.id, leadId);
    if (!lead) {
      return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }
  }

  const id = uuid();
  const now = new Date();

  await db.insert(activities).values({
    id,
    userId: session.user.id,
    leadId: leadId ?? null,
    type,
    content,
    createdAt: now,
  });

  return NextResponse.json({ id });
}
