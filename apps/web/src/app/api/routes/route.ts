import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import {
  isSession,
  requireSession,
  verifyLeadIdsOwned,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { savedRoutes } from "@/lib/db/schema";
import { OSS_LIMITS } from "@/lib/limits";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  leadIds: z.array(z.string().min(1)).min(1).max(50),
  mode: z.enum(["driving", "walking"]).default("driving"),
});

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const routes = await db
    .select()
    .from(savedRoutes)
    .where(eq(savedRoutes.userId, session.user.id));

  return NextResponse.json({ routes });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const existing = await db
    .select()
    .from(savedRoutes)
    .where(eq(savedRoutes.userId, session.user.id));

  if (existing.length >= OSS_LIMITS.savedRoutes) {
    return NextResponse.json({ error: "Saved route limit reached" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, leadIds, mode } = parsed.data;
  const owned = await verifyLeadIdsOwned(session.user.id, leadIds);

  if (owned.length !== leadIds.length) {
    return NextResponse.json(
      { error: "One or more leads are invalid" },
      { status: 400 },
    );
  }

  const id = uuid();
  const now = new Date();

  await db.insert(savedRoutes).values({
    id,
    userId: session.user.id,
    name,
    leadIds: JSON.stringify(leadIds),
    mode,
    createdAt: now,
  });

  return NextResponse.json({ id });
}
