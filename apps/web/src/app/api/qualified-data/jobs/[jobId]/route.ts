import { NextResponse } from "next/server";
import { fetchAm2Api } from "@/lib/am2-api";
import { requireSession, isSession } from "@/lib/api-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { jobId } = await params;
  const res = await fetchAm2Api(`/qualified-data/jobs/${jobId}`, {
    userId: session.user.id,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
