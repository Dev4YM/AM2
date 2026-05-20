"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Route, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface SavedRoute {
  id: string;
  name: string;
  leadIds: string;
  mode: string;
  createdAt: string;
}

export default function RoutesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saved, setSaved] = useState<SavedRoute[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"driving" | "walking">("driving");
  const [ordered, setOrdered] = useState<Lead[]>([]);
  const [routeName, setRouteName] = useState("My route");

  const load = () => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []));
    fetch("/api/routes")
      .then((r) => r.json())
      .then((d) => setSaved(d.routes ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(leads.map((l) => l.id)));
  const clearAll = () => setSelected(new Set());

  const picked = leads.filter((l) => selected.has(l.id));

  const optimize = async () => {
    if (picked.length < 2) {
      toast.error("Select at least 2 leads");
      return;
    }
    const res = await fetch("/api/routes/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: picked.map((l) => l.id) }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Optimization failed");
      return;
    }
    setOrdered(data.ordered ?? []);
    toast.success("Route optimized (greedy nearest-neighbor)");
  };

  const exportMaps = (list: Lead[]) => {
    if (list.length === 0) return;
    const dest = list[list.length - 1];
    const waypoints = list
      .slice(0, -1)
      .map((l) => `${l.lat},${l.lng}`)
      .join("|");
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&waypoints=${waypoints}&travelmode=${mode === "walking" ? "walking" : "driving"}`;
    window.open(url, "_blank");
  };

  const saveRoute = async () => {
    const list = ordered.length ? ordered : picked;
    const ids = list.map((l) => l.id);
    if (ids.length === 0) {
      toast.error("Select leads first");
      return;
    }
    const res = await fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: routeName, leadIds: ids, mode }),
    });
    if (!res.ok) {
      toast.error("Failed to save route");
      return;
    }
    toast.success("Route saved");
    load();
  };

  const deleteRoute = async (id: string) => {
    await fetch(`/api/routes/${id}`, { method: "DELETE" });
    toast.success("Route deleted");
    load();
  };

  const loadSavedRoute = (route: SavedRoute) => {
    const ids: string[] = JSON.parse(route.leadIds);
    const list = ids
      .map((id) => leads.find((l) => l.id === id))
      .filter(Boolean) as Lead[];
    setOrdered(list);
    setSelected(new Set(ids));
    setMode(route.mode as "driving" | "walking");
    setRouteName(route.name);
    toast.success(`Loaded "${route.name}"`);
  };

  const display = ordered.length ? ordered : picked;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold">Smart Routes</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Build visit order from CRM leads and export to Google Maps.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Select leads</CardTitle>
            <CardDescription>{selected.size} of {leads.length} selected</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear
              </Button>
            </div>
            <ScrollArea className="h-64">
              <ul className="flex flex-col gap-2">
                {leads.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 rounded-lg border p-2">
                    <Checkbox
                      checked={selected.has(l.id)}
                      onCheckedChange={() => toggle(l.id)}
                    />
                    <span className="text-sm">{l.name}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Build route</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "driving" | "walking")}>
              <TabsList>
                <TabsTrigger value="driving">Driving</TabsTrigger>
                <TabsTrigger value="walking">Walking</TabsTrigger>
              </TabsList>
              <TabsContent value={mode} className="mt-4 flex flex-col gap-2">
                <Button onClick={optimize}>
                  <Route data-icon="inline-start" />
                  Optimize order
                </Button>
                <Button variant="secondary" onClick={() => exportMaps(display)}>
                  <ExternalLink data-icon="inline-start" />
                  Open in Google Maps
                </Button>
              </TabsContent>
            </Tabs>
            <div className="flex flex-col gap-2">
              <Label htmlFor="route-name">Save as</Label>
              <div className="flex gap-2">
                <Input
                  id="route-name"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                />
                <Button variant="outline" onClick={saveRoute}>
                  <Save data-icon="inline-start" />
                  Save
                </Button>
              </div>
            </div>
            <ol className="list-decimal pl-5 text-sm">
              {display.map((l) => (
                <li key={l.id}>{l.name}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Saved routes</CardTitle>
            <CardDescription>{saved.length} stored locally</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {saved.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left text-sm font-medium hover:underline"
                        onClick={() => loadSavedRoute(r)}
                      >
                        {r.name}
                      </button>
                      <p className="text-muted-foreground text-xs">
                        {JSON.parse(r.leadIds).length} stops · {r.mode}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRoute(r.id)}
                        aria-label="Delete route"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {saved.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center">
                      No saved routes
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
