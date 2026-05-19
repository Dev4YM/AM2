import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, territories } from "@/lib/db/schema";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
] as const;

export type SessionUser = { id: string; email?: string | null; name?: string | null };

export async function requireSession(): Promise<
  { user: SessionUser } | NextResponse
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { user: session.user as SessionUser };
}

export function isSession(
  result: { user: SessionUser } | NextResponse,
): result is { user: SessionUser } {
  return !(result instanceof NextResponse);
}

export async function getOwnedLead(userId: string, leadId: string) {
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.userId, userId)))
    .limit(1);
  return lead ?? null;
}

export async function verifyLeadIdsOwned(userId: string, leadIds: string[]) {
  if (leadIds.length === 0) return [];
  const rows = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.userId, userId), inArray(leads.id, leadIds)));
  return rows.map((r) => r.id);
}

export async function verifyTerritoryOwned(userId: string, territoryId: string) {
  const [row] = await db
    .select({ id: territories.id })
    .from(territories)
    .where(and(eq(territories.id, territoryId), eq(territories.userId, userId)))
    .limit(1);
  return Boolean(row);
}
