"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { Download, Search } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  COUNTRIES,
  getCategories,
  getCities,
  getRegions,
  type CatalogBusiness,
} from "@/lib/business-catalog";

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false },
);

export function BusinessFinderApp() {
  const locale = useLocale();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("10");
  const [results, setResults] = useState<CatalogBusiness[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const regions = getRegions(country);
  const cities = region ? getCities(country, region) : [];
  const categories = getCategories();

  useEffect(() => {
    if (regions.length && !region) setRegion(regions[0]);
  }, [country, regions, region]);

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: query,
      country,
      region,
      city,
      limit,
    });
    if (category) params.set("category", category);
    const res = await fetch(`/api/search?${params}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }, [query, country, region, city, category, limit]);

  useEffect(() => {
    const t = setTimeout(() => {
      void search();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const importSelected = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogIds: [...selected] }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      toast.error(data.error);
      return;
    }
    const n = data.imported?.length ?? 0;
    const skipped = data.skipped ?? 0;
    toast.success(
      skipped > 0 ? `Imported ${n} leads (${skipped} duplicates skipped)` : `Imported ${n} leads`,
    );
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const center: [number, number] =
    results[0] ? [results[0].lat, results[0].lng] : [40.7128, -74.006];

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-r lg:w-96">
        <div className="flex flex-col gap-4 p-4">
          <div>
            <h1 className="text-lg font-semibold">Business Finder</h1>
            <p className="text-muted-foreground text-sm">
              Search the bundled sample catalog (self-hosted data).
            </p>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Import results into Mapped CRM. No live external business database on this deployment.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={category || "__all__"}
              onValueChange={(v) => setCategory(v === "__all__" ? "" : (v ?? ""))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="finder-query">Search</Label>
            <Input
              id="finder-query"
              placeholder="Industry, name, keyword…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Country</Label>
            <Select
              value={country}
              onValueChange={(v) => v && setCountry(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Region</Label>
            <Select
              value={region}
              onValueChange={(v) => v && setRegion(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>City</Label>
            <Select
              value={city}
              onValueChange={(v) => v && setCity(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="finder-limit">Max results</Label>
            <Input
              id="finder-limit"
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {["Name", "Category", "Coords", "Reviews", "Email", "Phone"].map((label) => (
              <Badge key={label} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>

          <Button onClick={search} disabled={loading}>
            <Search data-icon="inline-start" />
            {loading ? "Searching…" : "Search catalog"}
          </Button>

          {selected.size > 0 && (
            <Button variant="secondary" onClick={importSelected} disabled={loading}>
              <Download data-icon="inline-start" />
              Import {selected.size} to CRM
            </Button>
          )}

          <ButtonLink variant="outline" size="sm" href={`${prefix}/app/crm`}>
            Open Mapped CRM
          </ButtonLink>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-4 pb-4">
          <ul className="flex flex-col gap-2">
            {results.map((b) => (
              <li
                key={b.id}
                className="flex items-start gap-2 rounded-lg border p-2 text-sm"
              >
                <Checkbox
                  checked={selected.has(b.id)}
                  onCheckedChange={() => toggleSelect(b.id)}
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => toggleSelect(b.id)}
                >
                  <span className="font-medium">{b.name}</span>
                  <br />
                  <span className="text-muted-foreground text-xs">
                    {b.category} · ★ {b.rating}
                  </span>
                  {b.email && (
                    <Badge variant="secondary" className="mt-1">
                      enriched
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </aside>

      <div className="relative min-h-64 flex-1">
        <LeafletMap
          center={center}
          markers={results.map((b) => ({
            id: b.id,
            lat: b.lat,
            lng: b.lng,
            label: b.name,
          }))}
          onMarkerClick={toggleSelect}
        />
      </div>
    </div>
  );
}
