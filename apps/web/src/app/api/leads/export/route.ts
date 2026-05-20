import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.userId, session.user.id));

  const headers = [
    "name",
    "category",
    "address",
    "lat",
    "lng",
    "phone",
    "mobile",
    "email",
    "website",
    "rating",
    "status",
    "notes",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => escape(r[h as keyof typeof r])).join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="area-to-monitor-leads-${Date.now()}.csv"`,
    },
  });
}
