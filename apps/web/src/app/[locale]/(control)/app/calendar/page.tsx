"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CalEvent {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  leadId: string | null;
}

interface Lead {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const locale = useLocale();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [leadId, setLeadId] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []));
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  const leadName = (id: string | null) =>
    id ? (leads.find((l) => l.id === id)?.name ?? "Unknown lead") : null;

  const addEvent = async () => {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        startsAt: startsAt || new Date().toISOString(),
        leadId: leadId || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to create event");
      return;
    }
    toast.success("Event created");
    setTitle("");
    setDescription("");
    setStartsAt("");
    setLeadId("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    toast.success("Event removed");
    load();
  };

  const upcoming = [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Follow-ups stored locally and linked to CRM leads.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New event</CardTitle>
            <CardDescription>Schedule calls and visits tied to a lead</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ev-title">Title</Label>
              <Input
                id="ev-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Discovery call"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Linked lead</Label>
              <Select
                value={leadId || "__none__"}
                onValueChange={(v) => setLeadId(v === "__none__" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Optional lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No lead</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ev-start">Start</Label>
              <Input
                id="ev-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ev-desc">Notes</Label>
              <Textarea
                id="ev-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={addEvent} disabled={loading}>
              <Plus data-icon="inline-start" />
              Add event
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>{upcoming.length} events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <span className="font-medium">{e.title}</span>
                      {e.description && (
                        <p className="text-muted-foreground text-xs">{e.description}</p>
                      )}
                      {e.leadId && (
                        <p className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {leadName(e.leadId)}
                          </Badge>
                          <Link
                            href={`${prefix}/app/crm`}
                            className="text-primary ml-2 text-xs underline"
                          >
                            CRM
                          </Link>
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(e.startsAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(e.id)}
                        aria-label="Delete"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {upcoming.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-center">
                      No events scheduled
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
