import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchCatalog } from "@/lib/business-catalog";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const results = searchCatalog({
    query: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    country: searchParams.get("country") ?? "US",
    region: searchParams.get("region") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    limit: Number(searchParams.get("limit") ?? 50),
  });

  return NextResponse.json({ results });
}
