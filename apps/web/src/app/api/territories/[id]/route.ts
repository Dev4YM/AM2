import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { territories, leads } from "@/lib/db/schema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (body.name != null) patch.name = String(body.name).trim();
  if (body.color != null) patch.color = body.color;
  if (body.geoJson != null) {
    patch.geoJson =
      typeof body.geoJson === "string" ? body.geoJson : JSON.stringify(body.geoJson);
  }
  if (body.assignedRepId !== undefined) patch.assignedRepId = body.assignedRepId;

  await db
    .update(territories)
    .set(patch)
    .where(and(eq(territories.id, id), eq(territories.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(leads)
    .set({ territoryId: null })
    .where(and(eq(leads.territoryId, id), eq(leads.userId, session.user.id)));

  await db
    .delete(territories)
    .where(and(eq(territories.id, id), eq(territories.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
