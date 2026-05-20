import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { territories } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(territories)
    .where(eq(territories.userId, session.user.id));

  return NextResponse.json({ territories: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const geoJson =
    body.geoJson ??
    JSON.stringify({
      type: "Point",
      coordinates: [body.lng ?? -74.006, body.lat ?? 40.7128],
    });

  const id = uuid();
  const now = new Date();

  await db.insert(territories).values({
    id,
    userId: session.user.id,
    name,
    color: body.color ?? "#3b82f6",
    geoJson: typeof geoJson === "string" ? geoJson : JSON.stringify(geoJson),
    assignedRepId: body.assignedRepId ?? null,
    createdAt: now,
  });

  return NextResponse.json({ id });
}
