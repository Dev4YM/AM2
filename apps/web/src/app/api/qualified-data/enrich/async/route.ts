import { NextResponse } from "next/server";
import { fetchAm2Api } from "@/lib/am2-api";
import { requireSession, isSession } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const body = await req.json();
  const res = await fetchAm2Api("/qualified-data/enrich/async", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    userId: session.user.id,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
