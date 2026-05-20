"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import {
  ChevronDown,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  Search,
  Square,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MapTypeId } from "@/components/finder/finder-map-toolbar";
import { routing } from "@/i18n/routing";
import { ButtonLink } from "@/components/ui/button-link";
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { GeoCascadeSelect } from "@/components/finder/geo-cascade-select";
import {
  QualifiedDataPanel,
  QualifiedDataPanelLegend,
} from "@/components/finder/qualified-data-panel";
import { QualifiedDataResultSections } from "@/components/finder/qualified-data-result-sections";
import { COUNTRIES } from "@/lib/countries";
import {
  countryHasGeoHierarchy,
  isGeoSelectionComplete,
  resolveGeoSearchContext,
  resolveSearchAnchors,
} from "@am2/shared";
import { DEFAULT_REACHING_CAP } from "@am2/shared";
import {
  enrichQualifiedData,
  type QualifiedBusinessProfile,
  type QualifiedTierKey,
} from "@/lib/qualified-data-api";
import {
  mergeQualifiedProfiles,
  tiersPendingEnrichment,
} from "@/lib/merge-qualified-profile";
import { PLACE_CATEGORIES } from "@/lib/place-categories";
import type { FinderBusiness, MapBounds } from "@/types/finder";
import type { MapDrawMode, MapRefocusTarget } from "@/components/map/google-finder-map";
import {
  clampBoundsForPlacesSearch,
  isInvalidRectanglePlacesError,
  isViewportTooWideForPlaces,
  resolveNearestLandAnchor,
  searchBoundsAroundAnchor,
} from "@/lib/map-viewport";

const GoogleFinderMap = dynamic(
  () => import("@/components/map/google-finder-map").then((m) => m.GoogleFinderMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted flex size-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    ),
  },
);

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type SearchMode = "area" | "viewport" | "text";

interface SearchSnapshot {
  country: string;
  regionId: string;
  provinceId: string;
  cityId: string;
}

export function BusinessFinderApp() {
  const locale = useLocale();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [regionId, setRegionId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(String(DEFAULT_REACHING_CAP));
  const [searchCapped, setSearchCapped] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState<number | null>(null);
  const [results, setResults] = useState<FinderBusiness[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<Set<QualifiedTierKey>>(
    () => new Set<QualifiedTierKey>(["business", "enriched"]),
  );
  const [enrichedByPlace, setEnrichedByPlace] = useState<
    Record<string, QualifiedBusinessProfile>
  >({});
  const [enrichLoading, setEnrichLoading] = useState<Record<string, Set<QualifiedTierKey>>>(
    {},
  );
  const [enrichErrors, setEnrichErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [placesEnabled, setPlacesEnabled] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const [drawMode, setDrawMode] = useState<MapDrawMode>("pan");
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null);
  const [viewportBounds, setViewportBounds] = useState<MapBounds | null>(null);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [searchMode, setSearchMode] = useState<string>("");
  const [mapType, setMapType] = useState<MapTypeId>("roadmap");
  const [refocusTarget, setRefocusTarget] = useState<MapRefocusTarget | null>(null);
  const [refocusTrigger, setRefocusTrigger] = useState(0);
  const pendingSearchRef = useRef<SearchMode | null>(null);
  const pendingSearchBoundsRef = useRef<MapBounds | null>(null);
  const pendingAreaSearchRef = useRef(false);
  const enrichInFlightRef = useRef(new Set<string>());
  const [lastSearchSnapshot, setLastSearchSnapshot] = useState<SearchSnapshot | null>(
    null,
  );

  const handleViewportBoundsChange = useCallback((b: MapBounds) => {
    setViewportBounds((prev) => {
      if (
        prev &&
        prev.north === b.north &&
        prev.south === b.south &&
        prev.east === b.east &&
        prev.west === b.west
      ) {
        return prev;
      }
      return b;
    });
  }, []);

  const handleMarkerClick = useCallback((id: string) => {
    setFocusedId(id);
    setPanelOpen(true);
  }, []);

  useEffect(() => {
    fetch("/api/search/config")
      .then((r) => r.json())
      .then((data) => setPlacesEnabled(Boolean(data.placesEnabled)))
      .catch(() => undefined);
  }, []);

  const requestRefocusToLand = useCallback(
    (viewport: MapBounds, retryMode: "area" | "viewport" | "text") => {
      const anchor = resolveNearestLandAnchor(viewport, country);
      const safeBounds = searchBoundsAroundAnchor(anchor);
      pendingSearchRef.current = retryMode;
      pendingSearchBoundsRef.current = safeBounds;
      setRefocusTarget({ ...anchor, zoom: Math.max(anchor.zoom, 6) });
      setRefocusTrigger((t) => t + 1);
      toast.message(`Zoomed to ${anchor.label} — finishing search…`);
    },
    [country],
  );

  const geoReady = isGeoSelectionComplete({
    countryCode: country,
    regionId,
    provinceId,
  });

  const runSearch = useCallback(
    async (
      mode: "area" | "viewport" | "text",
      bounds?: MapBounds | null,
      options?: { skipRefocus?: boolean },
    ) => {
      if (!geoReady) {
        toast.error("Select a region and state/province before searching.");
        return;
      }

      setLoading(true);
      setSearchError(null);
      setSearchCapped(false);
      setHasSearched(true);
      setDrawMode("pan");

      const params = new URLSearchParams({ country, limit });
      if (query.trim()) params.set("q", query.trim());
      if (regionId) params.set("region", regionId);
      if (provinceId) params.set("province", provinceId);
      if (cityId) params.set("city", cityId);
      if (category) params.set("category", category);

      let searchBounds: MapBounds | null =
        mode === "area" ? bounds ?? areaBounds : mode === "viewport" ? bounds ?? viewportBounds : null;

      if (
        searchBounds &&
        (mode === "viewport" || mode === "area") &&
        isViewportTooWideForPlaces(searchBounds)
      ) {
        if (!options?.skipRefocus) {
          requestRefocusToLand(searchBounds, mode);
          setLoading(false);
          return;
        }
        searchBounds = clampBoundsForPlacesSearch(searchBounds, country);
      }

      if (searchBounds) {
        params.set("north", String(searchBounds.north));
        params.set("south", String(searchBounds.south));
        params.set("east", String(searchBounds.east));
        params.set("west", String(searchBounds.west));
      }

      try {
        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        if (data.error) {
          if (
            !options?.skipRefocus &&
            searchBounds &&
            (mode === "viewport" || mode === "area") &&
            isInvalidRectanglePlacesError(String(data.error))
          ) {
            requestRefocusToLand(searchBounds, mode);
            setLoading(false);
            return;
          }
          setSearchError(data.error);
          setResults([]);
        } else {
          setResults(data.results ?? []);
          setSearchMode(data.searchMode ?? mode);
          setSearchCapped(Boolean(data.meta?.capped));
          const total =
            typeof data.total === "number"
              ? data.total
              : typeof data.meta?.totalFetched === "number"
                ? data.meta.totalFetched
                : (data.results?.length ?? 0);
          setTotalAvailable(total);
          setFitTrigger((t) => t + 1);
          setLastSearchSnapshot({
            country,
            regionId,
            provinceId,
            cityId,
          });
          if (data.results?.length === 0) {
            toast.message("No businesses found in this area. Try zooming in or drawing a smaller box.");
          } else if (data.meta?.capped) {
            toast.message(
              `Showing top ${data.results.length} results (limit ${data.meta.requestedLimit}). Narrow to a city for more precision.`,
            );
          }
        }
      } catch {
        setSearchError("Search request failed");
        setResults([]);
      }
      setLoading(false);
    },
    [
      query,
      country,
      regionId,
      provinceId,
      cityId,
      category,
      limit,
      areaBounds,
      viewportBounds,
      requestRefocusToLand,
      geoReady,
    ],
  );

  useEffect(() => {
    if (!countryHasGeoHierarchy(country) || !provinceId) return;
    const ctx = resolveGeoSearchContext({
      countryCode: country,
      regionId,
      provinceId,
      cityId,
    });
    const anchors = resolveSearchAnchors(ctx);
    if (anchors[0]) {
      setRefocusTarget({ ...anchors[0], zoom: Math.max(anchors[0].zoom, cityId ? 11 : 7) });
      setRefocusTrigger((t) => t + 1);
    }
  }, [country, regionId, provinceId, cityId]);

  const toggleTier = (tier: QualifiedTierKey) => {
    setSelectedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const enrichBusiness = useCallback(
    async (business: FinderBusiness) => {
      const placeId = business.placeId ?? business.id;
      if (!placeId) {
        toast.error("This listing has no Google place ID for enrichment.");
        return;
      }
      if (selectedTiers.size === 0) {
        toast.message("Select at least one qualified data tier.");
        return;
      }
      if (enrichInFlightRef.current.has(placeId)) return;

      const existing = enrichedByPlace[placeId];
      const tiers = tiersPendingEnrichment(selectedTiers, existing) as QualifiedTierKey[];
      if (tiers.length === 0) {
        toast.message("Already enriched for the selected tiers.");
        return;
      }

      enrichInFlightRef.current.add(placeId);
      setEnrichErrors((e) => {
        const next = { ...e };
        delete next[placeId];
        return next;
      });
      setEnrichLoading((m) => ({
        ...m,
        [placeId]: new Set([...(m[placeId] ?? []), ...tiers]),
      }));

      try {
        const profile = await enrichQualifiedData({ placeId, tiers });
        setEnrichedByPlace((m) => ({
          ...m,
          [placeId]: mergeQualifiedProfiles(m[placeId], profile),
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Enrichment failed";
        setEnrichErrors((m) => ({ ...m, [placeId]: message }));
        toast.error(message);
      } finally {
        enrichInFlightRef.current.delete(placeId);
        setEnrichLoading((m) => {
          const next = { ...m };
          const set = new Set(next[placeId]);
          for (const t of tiers) set.delete(t);
          if (set.size === 0) delete next[placeId];
          else next[placeId] = set;
          return next;
        });
      }
    },
    [selectedTiers, enrichedByPlace],
  );

  const handleCountryChange = (code: string) => {
    setCountry(code);
    setRegionId("");
    setProvinceId("");
    setCityId("");
    setHasSearched(false);
    setResults([]);
    setTotalAvailable(null);
  };

  const handleRefocusComplete = useCallback(() => {
    const pending = pendingSearchRef.current;
    const safeBounds = pendingSearchBoundsRef.current;
    pendingSearchRef.current = null;
    pendingSearchBoundsRef.current = null;
    if (pending && safeBounds) {
      setViewportBounds(safeBounds);
      void runSearch(pending, safeBounds, { skipRefocus: true });
    }
  }, [runSearch]);

  const importSelected = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    const picked = results.filter((b) => selected.has(b.id));
    const places = picked
      .filter((b) => b.source === "google" && b.placeId)
      .map((b) => ({ placeId: b.placeId! }));

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catalogIds: picked.filter((b) => b.source === "catalog").map((b) => b.id),
        places,
      }),
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
      skipped > 0 ? `Imported ${n} leads (${skipped} skipped)` : `Imported ${n} leads`,
    );
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    setFocusedId(id);
  };

  const territoryDirty = useMemo(() => {
    if (!lastSearchSnapshot || areaBounds) return false;
    return (
      lastSearchSnapshot.country !== country ||
      lastSearchSnapshot.regionId !== regionId ||
      lastSearchSnapshot.provinceId !== provinceId ||
      lastSearchSnapshot.cityId !== cityId
    );
  }, [lastSearchSnapshot, areaBounds, country, regionId, provinceId, cityId]);

  const primarySearch = useMemo((): { mode: SearchMode; label: string } => {
    if (areaBounds) {
      return { mode: "area", label: "Search Drawn Area" };
    }
    if (territoryDirty || (!hasSearched && geoReady)) {
      return { mode: "viewport", label: "Search Filtered Area" };
    }
    if (query.trim()) {
      return { mode: "text", label: "Search Keywords" };
    }
    return { mode: "viewport", label: "Search Visible Map" };
  }, [areaBounds, territoryDirty, hasSearched, geoReady, query]);

  const runPrimarySearch = useCallback(() => {
    void runSearch(primarySearch.mode);
  }, [runSearch, primarySearch.mode]);

  useEffect(() => {
    if (!pendingAreaSearchRef.current || !areaBounds || !geoReady) return;
    pendingAreaSearchRef.current = false;
    void runSearch("area");
  }, [areaBounds, geoReady, runSearch]);

  const clearArea = useCallback(() => {
    setAreaBounds(null);
    setDrawMode("pan");
  }, []);

  const handleDrawModeToggle = useCallback(() => {
    setDrawMode((m) => {
      const next = m === "area" ? "pan" : "area";
      toast.message(
        next === "area"
          ? "Drag on the map to draw a box (map panning is disabled while drawing)"
          : "Pan mode — move the map normally",
      );
      return next;
    });
  }, []);

  const handleDrawComplete = useCallback(() => {
    setDrawMode("pan");
    pendingAreaSearchRef.current = true;
    toast.message("Area drawn — searching…");
  }, []);

  return (
    <div className="relative flex h-[calc(100svh-3.5rem)] flex-col overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        {mapsApiKey ? (
          <GoogleFinderMap
            apiKey={mapsApiKey}
            countryCode={country}
            businesses={results}
            selectedIds={selected}
            focusedId={focusedId}
            drawMode={drawMode}
            mapType={mapType}
            areaBounds={areaBounds}
            onAreaBoundsChange={setAreaBounds}
            onViewportBoundsChange={handleViewportBoundsChange}
            fitResultsTrigger={fitTrigger}
            onMarkerClick={handleMarkerClick}
            onDrawModeToggle={handleDrawModeToggle}
            onMapTypeChange={setMapType}
            onClearArea={clearArea}
            onDrawComplete={handleDrawComplete}
            refocusTarget={refocusTarget}
            refocusTrigger={refocusTrigger}
            onRefocusComplete={handleRefocusComplete}
          />
        ) : (
          <div className="bg-muted flex size-full items-center justify-center p-8 text-center">
            <p className="text-muted-foreground max-w-md text-sm">
              Set <code className="bg-background rounded px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in
              .env.local and enable Maps JavaScript API + Places API (New).
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute top-3 right-3 z-30 flex gap-2">
        {selected.size > 0 && (
          <Button
            size="sm"
            className="pointer-events-auto shadow-md"
            onClick={importSelected}
            disabled={loading}
          >
            <Download data-icon="inline-start" />
            Import {selected.size}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="bg-background pointer-events-auto shadow-md"
          onClick={() => setPanelOpen((o) => !o)}
        >
          {panelOpen ? <X data-icon="inline-start" /> : <Search data-icon="inline-start" />}
          {panelOpen ? "Hide panel" : "Search panel"}
        </Button>
      </div>

      {drawMode === "area" && (
        <div className="bg-primary text-primary-foreground pointer-events-none absolute top-14 left-1/2 z-10 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-medium shadow-md">
          Drag on the map to draw your search box (fixed geographic area)
        </div>
      )}
      {/* Floating search + results panel */}
      {panelOpen && (
        <aside className="bg-background/95 absolute top-16 bottom-3 left-3 z-10 flex w-[min(100%,380px)] min-h-0 flex-col overflow-hidden rounded-xl border shadow-xl backdrop-blur-sm">
          {/* Always visible: search action */}
          <div className="shrink-0 space-y-2 border-b px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-sm font-semibold leading-none">Business Finder</h1>
              <span className="text-muted-foreground text-[10px]">Places</span>
            </div>

            {!placesEnabled && (
              <Alert variant="destructive" className="py-1.5">
                <AlertDescription className="text-[11px]">
                  Add GOOGLE_MAPS_API_KEY to .env
                </AlertDescription>
              </Alert>
            )}

            <Input
              className="h-8 text-sm"
              placeholder="Keywords: coffee, dentist…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runPrimarySearch()}
            />

            <div className="flex w-full">
              <Button
                size="sm"
                className="h-8 flex-1 rounded-r-none"
                disabled={loading || !placesEnabled || !geoReady}
                onClick={runPrimarySearch}
              >
                {loading ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : areaBounds ? (
                  <Square data-icon="inline-start" />
                ) : (
                  <Search data-icon="inline-start" />
                )}
                {loading ? "Searching…" : primarySearch.label}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={loading || !placesEnabled}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-r-md border border-transparent px-2 disabled:opacity-50"
                  aria-label="Territory filters"
                >
                  <ChevronDown className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[min(100vw-2rem,340px)] p-3">
                  <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wide uppercase">
                    Territory
                  </p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Country</Label>
                      <Select
                        value={country}
                        onValueChange={(code) => {
                          setCountry(code ?? "US");
                          setRegionId("");
                          setProvinceId("");
                          setCityId("");
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.flag} {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <GeoCascadeSelect
                      countryCode={country}
                      regionId={regionId}
                      provinceId={provinceId}
                      cityId={cityId}
                      disabled={loading}
                      onRegionChange={(id) => {
                        setRegionId(id);
                        setProvinceId("");
                        setCityId("");
                      }}
                      onProvinceChange={(id) => {
                        setProvinceId(id);
                        setCityId("");
                      }}
                      onCityChange={setCityId}
                    />
                  </div>
                  {!geoReady && countryHasGeoHierarchy(country) && (
                    <p className="text-muted-foreground mt-2 text-[10px]">
                      Region + state required.
                    </p>
                  )}
                  <Separator className="my-2" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      disabled={!areaBounds || !geoReady}
                      onClick={() => void runSearch("area")}
                    >
                      <Square data-icon="inline-start" />
                      Search drawn area
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!geoReady}
                      onClick={() => void runSearch("viewport")}
                    >
                      <MapPin data-icon="inline-start" />
                      Search visible map
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!geoReady || !query.trim()}
                      onClick={() => void runSearch("text")}
                    >
                      <Search data-icon="inline-start" />
                      Search keywords only
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {areaBounds && (
              <p className="text-muted-foreground text-[10px]">
                Drawn area active — button searches your box on the map.
              </p>
            )}
            {territoryDirty && !areaBounds && (
              <p className="text-primary text-[10px] font-medium">
                Territory changed — run Search Filtered Area to apply.
              </p>
            )}
            {!geoReady && countryHasGeoHierarchy(country) && (
              <p className="text-muted-foreground text-[10px]">
                Open ▾ and set region + state.
              </p>
            )}
            {searchError && (
              <Alert className="py-1.5">
                <AlertDescription className="text-[11px]">{searchError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 rounded-lg border bg-muted/20 p-2.5">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                Data filters
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Result limit</Label>
                  <Select
                    value={limit}
                    onValueChange={(v) => setLimit(v ?? String(DEFAULT_REACHING_CAP))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["40", "60", "80", "100"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} max
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Category</Label>
                  <Select
                    value={category || "__all__"}
                    onValueChange={(v) => setCategory(v === "__all__" ? "" : (v ?? ""))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {PLACE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value || "all"} value={c.value || "__all__"}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <QualifiedDataPanelLegend />
                <QualifiedDataPanel
                  selectedTiers={selectedTiers}
                  onToggleTier={toggleTier}
                />
              </div>
            </div>
          </div>

          {/* Results — scroll region */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-3">

              <div className="flex items-center justify-between gap-2 px-0.5">
                <span className="text-xs font-medium">
                  {hasSearched ? (
                    <>
                      {totalAvailable != null && totalAvailable > results.length
                        ? `${results.length} / ${totalAvailable}`
                        : `${results.length} results`}
                      {searchCapped && (
                        <Badge variant="outline" className="ml-1 text-[9px]">
                          capped
                        </Badge>
                      )}
                      {searchMode === "area" && (
                        <Badge variant="secondary" className="ml-1 text-[9px]">
                          area
                        </Badge>
                      )}
                    </>
                  ) : (
                    "Results"
                  )}
                </span>
                {results.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() =>
                      selected.size === results.length
                        ? setSelected(new Set())
                        : setSelected(new Set(results.map((b) => b.id)))
                    }
                  >
                    {selected.size === results.length ? "Clear" : "All"}
                  </Button>
                )}
              </div>

              <Separator />
            <ul className="space-y-2 pb-1">
              {!hasSearched && !geoReady && countryHasGeoHierarchy(country) && (
                <li className="text-muted-foreground py-8 text-center text-xs">
                  <MapPin className="text-muted-foreground/60 mx-auto mb-2 size-8" />
                  <p className="font-medium">Choose your territory</p>
                  <p className="mt-1 leading-relaxed">
                    Select a region and state/province above, then search the map or draw an area.
                  </p>
                </li>
              )}
              {!hasSearched && geoReady && (
                <li className="text-muted-foreground py-6 text-center text-xs">
                  Territory set — run a search or draw an area on the map.
                </li>
              )}
              {hasSearched && results.length === 0 && (
                <li className="text-muted-foreground py-8 text-center text-xs">
                  <p className="font-medium">No businesses found</p>
                  <p className="mt-1 leading-relaxed">
                    Try a smaller area, another city, or different keywords.
                  </p>
                </li>
              )}
              {results.map((b) => {
                const placeKey = b.placeId ?? b.id;
                return (
                <li key={b.id}>
                  <Card
                    className={`cursor-pointer transition-shadow hover:shadow-md ${
                      focusedId === b.id ? "ring-2 ring-primary" : ""
                    } ${selected.has(b.id) ? "border-primary/50 bg-primary/5" : ""}`}
                    onClick={() => setFocusedId(b.id)}
                  >
                    <CardContent className="flex gap-2.5 p-3">
                      <Checkbox
                        checked={selected.has(b.id)}
                        onCheckedChange={() => toggleSelect(b.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">{b.name}</p>
                          {b.rating != null && (
                            <span className="flex shrink-0 items-center gap-0.5 text-xs text-amber-600">
                              <Star className="size-3 fill-current" />
                              {b.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px]">{b.category}</p>
                        <p className="text-muted-foreground line-clamp-2 text-[11px]">
                          {b.address}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {b.phone && (
                            <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
                              <Phone className="size-2.5" />
                              {b.phone}
                            </span>
                          )}
                          {b.openNow != null && (
                            <Badge
                              variant={b.openNow ? "default" : "secondary"}
                              className="h-4 px-1 text-[9px]"
                            >
                              {b.openNow ? "Open" : "Closed"}
                            </Badge>
                          )}
                          {b.reviewCount != null && b.reviewCount > 0 && (
                            <span className="text-muted-foreground text-[10px]">
                              {b.reviewCount} reviews
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {b.placeId && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-6 gap-1 px-2 text-[10px]"
                              disabled={
                                loading ||
                                selectedTiers.size === 0 ||
                                (enrichLoading[placeKey]?.size ?? 0) > 0
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                void enrichBusiness(b);
                              }}
                            >
                              <Sparkles className="size-3" />
                              {enrichedByPlace[placeKey]?.tiersCompleted?.length
                                ? "Enrich more"
                                : "Enrich"}
                            </Button>
                          )}
                          {b.website && (
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary text-[10px] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Website
                            </a>
                          )}
                          {b.googleMapsUri && (
                            <a
                              href={b.googleMapsUri}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary inline-flex items-center gap-0.5 text-[10px] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Maps <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                        <QualifiedDataResultSections
                          profile={enrichedByPlace[placeKey] ?? null}
                          loadingTiers={enrichLoading[placeKey] ?? new Set()}
                          error={enrichErrors[placeKey]}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </li>
                );
              })}
            </ul>
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t p-2">
            <ButtonLink variant="outline" size="sm" className="w-full" href={`${prefix}/app/crm`}>
              Open Mapped CRM
            </ButtonLink>
          </div>
        </aside>
      )}
    </div>
  );
}
