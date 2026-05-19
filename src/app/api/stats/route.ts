import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, activities, calendarEvents, teamMembers } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const allLeads = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.userId, userId));

  const pipeline = allLeads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const [activityCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(eq(activities.userId, userId));

  const [eventCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, userId));

  const [teamCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teamMembers)
    .where(eq(teamMembers.ownerId, userId));

  const recentActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.createdAt))
    .limit(8);

  return NextResponse.json({
    pipeline,
    totals: {
      leads: allLeads.length,
      activities: Number(activityCount?.count ?? 0),
      events: Number(eventCount?.count ?? 0),
      team: Number(teamCount?.count ?? 0),
    },
    recentActivities,
  });
}
