"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  Bot,
  Calendar,
  Map,
  Route,
  Search,
  Users,
  MapPinned,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const LINKS = [
  { href: "/app/finder", label: "Business Finder", icon: Search, desc: "Search sample catalog and import leads" },
  { href: "/app/crm", label: "Mapped CRM", icon: Map, desc: "GPS map, AI reviews & emails" },
  { href: "/app/routes", label: "Smart Routes", icon: Route, desc: "Optimize visits and export to Maps" },
  { href: "/app/calendar", label: "Calendar", icon: Calendar, desc: "Follow-ups linked to leads" },
  { href: "/app/territories", label: "Territories", icon: MapPinned, desc: "Sales areas and lead assignment" },
  { href: "/app/team", label: "Team", icon: Users, desc: "Reps on this deployment" },
  { href: "/app/assistant", label: "AI Assistant", icon: Bot, desc: "Ask about your pipeline" },
] as const;

interface Stats {
  pipeline: Record<string, number>;
  totals: { leads: number; activities: number; events: number; team: number };
  recentActivities: {
    id: string;
    type: string;
    content: string;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const locale = useLocale();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Area To Monitor (AM2) control plane — Beta · free, open source, self-hosted.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ?
          [
            { label: "Leads", value: stats.totals.leads },
            { label: "Activities", value: stats.totals.activities },
            { label: "Events", value: stats.totals.events },
            { label: "Team", value: stats.totals.team },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-3xl">{value}</CardTitle>
              </CardHeader>
            </Card>
          ))
        :   Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-8 w-12" />
              </CardHeader>
            </Card>
          ))
        }
      </div>

      {stats && Object.keys(stats.pipeline).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
            <CardDescription>Leads by status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(stats.pipeline).map(([status, count]) => (
              <Badge key={status} variant="secondary" className="text-sm">
                {status}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="text-sm font-medium">Modules</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {LINKS.map(({ href, label, icon: Icon, desc }) => (
              <Card key={href} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{label}</CardTitle>
                    <Icon className="text-muted-foreground size-5" />
                  </div>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <ButtonLink variant="outline" size="sm" href={`${prefix}${href}`}>
                    Open
                  </ButtonLink>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivities.length ?
              <ul className="flex flex-col gap-3">
                {stats.recentActivities.map((a) => (
                  <li key={a.id} className="text-sm">
                    <Badge variant="outline" className="mb-1">
                      {a.type}
                    </Badge>
                    <p className="line-clamp-2">{a.content}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                    <Separator className="mt-2" />
                  </li>
                ))}
              </ul>
            : <p className="text-muted-foreground text-sm">No activity yet — add notes in CRM</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
