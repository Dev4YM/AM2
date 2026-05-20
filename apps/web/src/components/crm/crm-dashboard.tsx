"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import {
  BarChart3,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false },
);

interface Lead {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  smartSalesJson: string | null;
  emailsJson: string | null;
  reviewsJson: string | null;
  territoryId: string | null;
}

interface Territory {
  id: string;
  name: string;
  color: string;
}

interface Activity {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  leadId: string | null;
}

const STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "secondary",
  contacted: "outline",
  qualified: "default",
  won: "default",
  lost: "destructive",
};

export function CrmDashboard() {
  const locale = useLocale();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("");
  const aiBusyRef = useRef(false);
  const [active, setActive] = useState<Lead | null>(null);
  const [activityType, setActivityType] = useState("call");
  const [activityContent, setActivityContent] = useState("");
  const [context, setContext] = useState("");
  const [notes, setNotes] = useState("");
  const [chat, setChat] = useState("");
  const [reply, setReply] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/leads");
    const data = await res.json();
    const list = data.leads ?? [];
    setLeads(list);
    setActive((cur) => (cur ? list.find((l: Lead) => l.id === cur.id) ?? null : null));
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/user/settings");
    const data = await res.json();
    if (data.businessContext) setContext(data.businessContext);
  }, []);

  const loadActivities = useCallback(async () => {
    const res = await fetch("/api/activities");
    const data = await res.json();
    const all: Activity[] = data.activities ?? [];
    if (active) {
      setActivities(all.filter((a) => a.leadId === active.id));
    } else {
      setActivities(all.slice(0, 20));
    }
  }, [active]);

  useEffect(() => {
    load();
    loadSettings();
    fetch("/api/territories")
      .then((r) => r.json())
      .then((d) => setTerritories(d.territories ?? []));
  }, [load, loadSettings]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities, active]);

  useEffect(() => {
    if (active) setNotes(active.notes ?? "");
  }, [active?.id, active?.notes]);

  const territoryColor = (id: string | null) =>
    territories.find((t) => t.id === id)?.color;

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (territoryFilter && l.territoryId !== territoryFilter) return false;
      if (statusFilter && l.status !== statusFilter) return false;
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.status.includes(q) ||
        (l.address?.toLowerCase().includes(q) ?? false) ||
        (l.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [leads, territoryFilter, statusFilter, filter]);

  const pipelineStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUSES) counts[s] = 0;
    for (const l of leads) {
      if (counts[l.status] != null) counts[l.status]++;
    }
    return counts;
  }, [leads]);

  const safeJson = <T,>(raw: string | null | undefined, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const parsedReviews = safeJson<
    { author: string; rating: number; text: string }[]
  >(active?.reviewsJson, []);

  const parsedSales = safeJson<{
    summary?: string;
    painPoints?: string[];
    angles?: string[];
  } | null>(active?.smartSalesJson, null);

  const parsedEmails = safeJson<{ subject?: string; body?: string }[] | null>(
    active?.emailsJson,
    null,
  );

  const assignTerritory = async (territoryId: string | null) => {
    if (!active) return;
    const tid = territoryId === "__none__" ? null : territoryId;
    await fetch(`/api/leads/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ territoryId: tid }),
    });
    await load();
    toast.success("Territory updated");
  };

  const logActivity = async () => {
    if (!active || !activityContent.trim()) return;
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: active.id,
        type: activityType,
        content: activityContent.trim(),
      }),
    });
    setActivityContent("");
    toast.success("Activity logged");
    loadActivities();
  };

  const copyEmails = () => {
    if (!parsedEmails?.length) return;
    const text = parsedEmails
      .map((e, i) => `Email ${i + 1}\nSubject: ${e.subject}\n\n${e.body}`)
      .join("\n\n---\n\n");
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const runAction = async (action: string) => {
    if (!active || aiBusyRef.current) return;
    if (action === "smart-reviews" && active.smartSalesJson) {
      toast.message("Smart analysis already saved — open Reviews or re-run after clearing.");
      return;
    }
    if (action === "smart-emails" && active.emailsJson) {
      toast.message("Email drafts already saved for this lead.");
      return;
    }
    aiBusyRef.current = true;
    setLoading(true);
    const res = await fetch(`/api/leads/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, businessContext: context }),
    });
    const data = await res.json();
    setLoading(false);
    aiBusyRef.current = false;
    if (!res.ok) {
      toast.error(data.error ?? "Action failed");
      return;
    }
    await load();
    if (action === "smart-reviews") {
      setReply(JSON.stringify(data.analysis, null, 2));
      toast.success("Smart analysis generated");
    }
    if (action === "smart-emails") {
      setReply(JSON.stringify(data.emails, null, 2));
      toast.success("Smart emails generated");
    }
    loadActivities();
  };

  const updateStatus = async (status: string | null) => {
    if (!active || !status) return;
    await fetch(`/api/leads/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setActive((a) => (a ? { ...a, status } : null));
    toast.success("Status updated");
    loadActivities();
  };

  const saveNotes = async () => {
    if (!active) return;
    await fetch(`/api/leads/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    toast.success("Notes saved");
    await load();
    loadActivities();
  };

  const deleteLead = async () => {
    if (!active) return;
    await fetch(`/api/leads/${active.id}`, { method: "DELETE" });
    toast.success("Lead removed");
    setActive(null);
    await load();
  };

  const askAssistant = async () => {
    if (!chat.trim()) return;
    setLoading(true);
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Lead: ${active?.name ?? "pipeline"}. ${chat}`,
      }),
    });
    const data = await res.json();
    setReply(data.reply);
    setLoading(false);
  };

  const center: [number, number] =
    active ? [active.lat, active.lng]
    : filtered[0] ? [filtered[0].lat, filtered[0].lng]
    : [40.7128, -74.006];

  if (leads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
          <MapPin className="text-muted-foreground size-7" />
        </div>
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold">Mapped CRM</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Import leads from Business Finder to see them on the map, track pipeline
            status, and run AI outreach.
          </p>
        </div>
        <ButtonLink href={`${prefix}/app/finder`}>
          <Search data-icon="inline-start" />
          Open Business Finder
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem)]">
      <aside className="flex w-80 shrink-0 flex-col border-r bg-muted/20">
        <div className="flex flex-col gap-2.5 border-b p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-sm font-semibold">Mapped CRM</h1>
              <p className="text-muted-foreground text-[10px]">
                {filtered.length} of {leads.length} leads
              </p>
            </div>
            <ButtonLink href={`${prefix}/app/finder`} variant="outline" size="xs">
              <Search data-icon="inline-start" />
              Finder
            </ButtonLink>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                title={STATUS_LABELS[s]}
                onClick={() => setStatusFilter((cur) => (cur === s ? "" : s))}
                className={`rounded-md border px-1 py-1 text-center text-[9px] font-medium transition-colors ${
                  statusFilter === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent bg-background/80 hover:bg-muted"
                }`}
              >
                <span className="block text-[11px] font-semibold tabular-nums">
                  {pipelineStats[s]}
                </span>
                <span className="text-muted-foreground capitalize">{s.slice(0, 3)}</span>
              </button>
            ))}
          </div>

          <Input
            className="h-8"
            placeholder="Search name, email, address…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Select
            value={territoryFilter || "__all__"}
            onValueChange={(v) => setTerritoryFilter(v === "__all__" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="All territories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All territories</SelectItem>
              {territories.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            nativeButton={false}
            render={<a href="/api/leads/export" download />}
          >
            <Download data-icon="inline-start" />
            Export CSV
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <ul className="flex flex-col gap-1 p-2">
            {filtered.length === 0 && (
              <li className="text-muted-foreground py-8 text-center text-xs">
                No leads match filters.
              </li>
            )}
            {filtered.map((l) => {
              const color = territoryColor(l.territoryId);
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setActive(l)}
                    className={`hover:bg-accent w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
                      active?.id === l.id ? "border-primary bg-accent" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color ?? "var(--muted-foreground)" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-medium">{l.name}</span>
                          {l.rating != null && (
                            <span className="text-muted-foreground shrink-0 text-[10px]">
                              ★ {l.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge
                            variant={STATUS_BADGE[l.status] ?? "outline"}
                            className="h-4 px-1 text-[9px] capitalize"
                          >
                            {l.status}
                          </Badge>
                          {l.email && (
                            <span className="text-muted-foreground truncate text-[10px]">
                              {l.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </aside>

      <div className="relative min-w-0 flex-1">
        <LeafletMap
          center={center}
          markers={filtered.map((l) => ({
            id: l.id,
            lat: l.lat,
            lng: l.lng,
            label: l.name,
            color: territoryColor(l.territoryId) ?? undefined,
          }))}
          onMarkerClick={(id) =>
            setActive(leads.find((l) => l.id === id) ?? null)
          }
        />
      </div>

      {active ? (
        <aside className="flex w-[min(100%,28rem)] shrink-0 flex-col border-l">
          <div className="flex items-start justify-between gap-2 border-b p-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-sm font-semibold">{active.name}</h2>
                <Badge
                  variant={STATUS_BADGE[active.status] ?? "outline"}
                  className="h-5 capitalize"
                >
                  {active.status}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {active.address ?? "No address"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {active.phone && (
                  <a
                    href={`tel:${active.phone}`}
                    className="bg-muted hover:bg-muted/80 inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px]"
                  >
                    <Phone className="size-3" />
                    Call
                  </a>
                )}
                {active.email && (
                  <a
                    href={`mailto:${active.email}`}
                    className="bg-muted hover:bg-muted/80 inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px]"
                  >
                    <Mail className="size-3" />
                    Email
                  </a>
                )}
                {active.website && (
                  <a
                    href={active.website}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-muted hover:bg-muted/80 inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px]"
                  >
                    <Globe className="size-3" />
                    Site
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps?q=${active.lat},${active.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-muted hover:bg-muted/80 inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px]"
                >
                  <ExternalLink className="size-3" />
                  Maps
                </a>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Delete lead">
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes {active.name} from your CRM permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={deleteLead}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-3 mt-2 grid w-auto grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs">
                <Sparkles className="size-3" data-icon="inline-start" />
                AI
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-2">
                    <Label>Status</Label>
                    <Select value={active.status} onValueChange={updateStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Territory</Label>
                    <Select
                      value={active.territoryId ?? "__none__"}
                      onValueChange={(v) => assignTerritory(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {territories.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Card className="bg-muted/30">
                    <CardContent className="grid grid-cols-2 gap-3 p-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase">
                          Rating
                        </span>
                        <p className="font-medium">
                          {active.rating != null ? `★ ${active.rating.toFixed(1)}` : "—"}
                          {active.reviewCount != null && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              ({active.reviewCount})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase">
                          Coordinates
                        </span>
                        <p className="font-mono text-[11px]">
                          {active.lat.toFixed(4)}, {active.lng.toFixed(4)}
                        </p>
                      </div>
                      {active.phone && (
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase">
                            Phone
                          </span>
                          <p>{active.phone}</p>
                        </div>
                      )}
                      {active.email && (
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase">
                            Email
                          </span>
                          <p className="truncate">{active.email}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button size="sm" variant="secondary" onClick={saveNotes}>
                      Save notes
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="reviews" className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                {parsedReviews.length === 0 ?
                  <p className="text-muted-foreground text-sm">
                    No reviews on file. Import from Business Finder or run Smart Reviews.
                  </p>
                : <ul className="flex flex-col gap-3">
                    {parsedReviews.map((r, i) => (
                      <li key={i} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{r.author}</span>
                          <Badge variant="secondary">★ {r.rating}</Badge>
                        </div>
                        <p className="mt-2">{r.text}</p>
                      </li>
                    ))}
                  </ul>
                }
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-2">
                    <Label>Business context</Label>
                    <Textarea
                      rows={2}
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                    />
                    <p className="text-muted-foreground text-xs">
                      Saved globally in Settings
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={loading || Boolean(active.smartSalesJson)}
                      onClick={() => runAction("smart-reviews")}
                    >
                      <BarChart3 data-icon="inline-start" />
                      {active.smartSalesJson ? "Analysis saved" : "Smart analysis"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loading || Boolean(active.emailsJson)}
                      onClick={() => runAction("smart-emails")}
                    >
                      <Mail data-icon="inline-start" />
                      {active.emailsJson ? "Emails saved" : "Smart emails"}
                    </Button>
                    {parsedEmails && parsedEmails.length > 0 && (
                      <Button size="sm" variant="outline" onClick={copyEmails}>
                        <Copy data-icon="inline-start" />
                        Copy emails
                      </Button>
                    )}
                  </div>

                  {parsedSales && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Saved smart sales</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2 text-sm">
                        {parsedSales.summary && <p>{parsedSales.summary}</p>}
                        {parsedSales.painPoints && parsedSales.painPoints.length > 0 && (
                          <div>
                            <p className="text-muted-foreground font-medium">Pain points</p>
                            <ul className="mt-1 list-disc pl-4">
                              {parsedSales.painPoints.map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {parsedEmails && parsedEmails.length > 0 && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Saved emails</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {parsedEmails.map((e, i) => (
                          <div key={i} className="rounded border p-2 text-xs">
                            <p className="font-medium">{e.subject}</p>
                            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                              {e.body}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {reply && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Output</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="max-h-56 overflow-auto text-xs whitespace-pre-wrap">
                          {reply}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Label>Ask about this lead</Label>
                    <Input
                      value={chat}
                      onChange={(e) => setChat(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && askAssistant()}
                    />
                    <Button size="sm" disabled={loading} onClick={askAssistant}>
                      <MessageSquare data-icon="inline-start" />
                      Ask AI
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity" className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="mb-4 flex flex-col gap-2 rounded-lg border p-3">
                  <Label>Log activity</Label>
                  <Select
                    value={activityType}
                    onValueChange={(v) => v && setActivityType(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="visit">Visit</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    rows={2}
                    placeholder="What happened?"
                    value={activityContent}
                    onChange={(e) => setActivityContent(e.target.value)}
                  />
                  <Button size="sm" onClick={logActivity}>
                    Log activity
                  </Button>
                </div>
                <ul className="flex flex-col gap-3">
                  {activities.length === 0 && (
                    <p className="text-muted-foreground text-sm">No activity yet</p>
                  )}
                  {activities.map((a) => (
                    <li key={a.id} className="rounded-lg border p-3 text-sm">
                      <Badge variant="outline" className="mb-1">
                        {a.type}
                      </Badge>
                      <p>{a.content}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      ) : (
        <aside className="text-muted-foreground flex w-72 shrink-0 flex-col items-center justify-center gap-2 border-l p-6 text-center">
          <MapPin className="size-10 opacity-40" />
          <p className="text-sm font-medium">Select a lead</p>
          <p className="text-xs leading-relaxed">
            Choose a lead from the list or click a marker on the map.
          </p>
        </aside>
      )}
    </div>
  );
}
