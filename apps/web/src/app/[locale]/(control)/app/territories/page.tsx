"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Territory {
  id: string;
  name: string;
  color: string;
  geoJson: string;
  assignedRepId: string | null;
}

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [lat, setLat] = useState("40.7128");
  const [lng, setLng] = useState("-74.0060");

  const load = () =>
    fetch("/api/territories")
      .then((r) => r.json())
      .then((d) => setTerritories(d.territories ?? []));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    const res = await fetch("/api/territories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        color,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      }),
    });
    if (!res.ok) {
      toast.error("Failed to create territory");
      return;
    }
    toast.success("Territory created");
    setName("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/territories/${id}`, { method: "DELETE" });
    toast.success("Territory removed");
    load();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold">Territories</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Define sales areas and assign leads from the CRM map.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New territory</CardTitle>
          <CardDescription>Anchor point used for map reference (expand to polygons later)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="t-name">Name</Label>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Downtown NYC" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="t-color">Color</Label>
            <Input id="t-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="t-lat">Latitude</Label>
            <Input id="t-lat" value={lat} onChange={(e) => setLat(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="t-lng">Longitude</Label>
            <Input id="t-lng" value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button onClick={create} className="w-full">
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your territories</CardTitle>
          <CardDescription>{territories.length} defined</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Anchor</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {territories.map((t) => {
                let coords: number[] = [];
                try {
                  const g = JSON.parse(t.geoJson);
                  coords = g.coordinates ?? [];
                } catch {
                  /* ignore */
                }
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: t.color }} className="text-white">
                        {t.color}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <MapPin className="mr-1 inline size-3" />
                      {coords[1]?.toFixed(4)}, {coords[0]?.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(t.id)}
                        aria-label="Delete"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {territories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No territories yet — assign leads from CRM after creating one
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
