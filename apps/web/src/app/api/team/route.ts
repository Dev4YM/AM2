import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { OSS_LIMITS } from "@/lib/limits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.ownerId, session.user.id));

  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.ownerId, session.user.id));

  if (existing.length >= OSS_LIMITS.teamMembers) {
    return NextResponse.json({ error: "Team member limit reached" }, { status: 400 });
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  const id = uuid();
  const now = new Date();

  await db.insert(teamMembers).values({
    id,
    ownerId: session.user.id,
    name,
    email,
    role: body.role ?? "rep",
    territoryIds: body.territoryIds ?? null,
    createdAt: now,
  });

  return NextResponse.json({ id });
}
