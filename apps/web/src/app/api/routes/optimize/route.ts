import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  isSession,
  requireSession,
  verifyLeadIdsOwned,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { optimizeRouteOrder } from "@/lib/route-optimize";

const schema = z.object({
  leadIds: z.array(z.string().min(1)).min(1).max(50),
  startLeadId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { leadIds, startLeadId } = parsed.data;
  const owned = await verifyLeadIdsOwned(session.user.id, leadIds);

  if (owned.length !== leadIds.length) {
    return NextResponse.json(
      { error: "One or more leads are invalid" },
      { status: 400 },
    );
  }

  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      lat: leads.lat,
      lng: leads.lng,
    })
    .from(leads)
    .where(eq(leads.userId, session.user.id));

  const selected = rows.filter((r) => leadIds.includes(r.id));
  const ordered = optimizeRouteOrder(selected, startLeadId);

  return NextResponse.json({ ordered });
}
