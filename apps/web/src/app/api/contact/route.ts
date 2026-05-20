import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { getSqlite } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  message: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const sqlite = getSqlite();
  const id = uuid();
  const now = Date.now();

  sqlite
    .prepare(
      `INSERT INTO contact_inquiries (id, name, email, message, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, parsed.data.name, parsed.data.email, parsed.data.message, now);

  return NextResponse.json({ ok: true, id });
}
