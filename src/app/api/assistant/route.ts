import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { chatAssistant } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.userId, session.user.id))
    .limit(20);

  const context = rows
    .map(
      (l) =>
        `${l.name} (${l.status}) rating ${l.rating} at ${l.address}`,
    )
    .join("\n");

  const reply = await chatAssistant(message, context);
  return NextResponse.json({ reply });
}
