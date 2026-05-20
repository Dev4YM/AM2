import { NextResponse } from "next/server";
import { requireSession, isSession } from "@/lib/api-helpers";
import { fetchAm2Api } from "@/lib/am2-api";
import { countCatalog, searchCatalog } from "@/lib/business-catalog";
import { DEFAULT_REACHING_CAP, isGooglePlacesConfigured } from "@/lib/google-places";
import { isGeoSelectionComplete } from "@am2/shared";
import type { FinderBusiness, MapBounds } from "@/types/finder";

function parseBounds(searchParams: URLSearchParams): MapBounds | undefined {
  const north = searchParams.get("north");
  const south = searchParams.get("south");
  const east = searchParams.get("east");
  const west = searchParams.get("west");
  if (!north || !south || !east || !west) return undefined;
  const bounds = {
    north: Number(north),
    south: Number(south),
    east: Number(east),
    west: Number(west),
  };
  if (Object.values(bounds).some((n) => Number.isNaN(n))) return undefined;
  if (bounds.north <= bounds.south) return undefined;
  return bounds;
}

export async function GET(req: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") ?? "US";
  const region = searchParams.get("region") ?? undefined;
  const province = searchParams.get("province") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const cityLegacy = searchParams.get("cityName") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const query = searchParams.get("q") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? DEFAULT_REACHING_CAP);
  const bounds = parseBounds(searchParams);
  const forceCatalog = searchParams.get("source") === "catalog";

  if (
    !isGeoSelectionComplete({
      countryCode: country,
      regionId: region,
      provinceId: province,
    })
  ) {
    return NextResponse.json(
      {
        error: "Select a region and state/province before searching.",
        results: [],
        source: "google",
        googleEnabled: isGooglePlacesConfigured(),
      },
      { status: 400 },
    );
  }

  const googleEnabled = isGooglePlacesConfigured();

  if (googleEnabled && !forceCatalog) {
    try {
      const proxyParams = new URLSearchParams(searchParams);
      if (bounds && !proxyParams.has("mode")) {
        proxyParams.set("mode", "reaching");
      }
      const res = await fetchAm2Api(`/search?${proxyParams.toString()}`, {
        userId: session.user.id,
      });
      const data = (await res.json()) as {
        results?: FinderBusiness[];
        total?: number;
        limit?: number;
        error?: string;
        message?: string;
        source?: string;
        googleEnabled?: boolean;
        searchMode?: string;
        meta?: Record<string, unknown>;
      };

      if (!res.ok) {
        const message =
          data.message ??
          data.error ??
          (typeof data === "object" && "statusCode" in data
            ? String((data as { message?: string }).message)
            : "Search failed");
        return NextResponse.json(
          { error: message, results: [], source: "google", googleEnabled: true },
          { status: res.status >= 400 ? res.status : 502 },
        );
      }

      return NextResponse.json({
        results: data.results ?? [],
        total: data.meta?.totalFetched ?? data.results?.length ?? 0,
        limit: data.limit ?? limit,
        source: "google" as const,
        googleEnabled: true,
        searchMode: data.searchMode ?? (bounds ? "area" : "text"),
        meta: data.meta,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Search service unavailable";
      return NextResponse.json(
        {
          error: `${message}. Start the API with: npm run dev:api`,
          results: [],
          source: "google",
          googleEnabled: true,
        },
        { status: 502 },
      );
    }
  }

  const catalogRegion = province ?? region;
  const catalogTotal = countCatalog({
    query,
    category,
    country,
    region: catalogRegion,
    city: cityLegacy,
  });

  const catalogResults = searchCatalog({
    query,
    category,
    country,
    region: catalogRegion,
    city: cityLegacy,
    limit,
  }).map(
    (b): FinderBusiness => ({
      id: b.id,
      source: "catalog",
      name: b.name,
      category: b.category,
      address: `${b.address}, ${b.city}`,
      city: b.city,
      region: b.region,
      country: b.country,
      lat: b.lat,
      lng: b.lng,
      phone: b.phone,
      website: b.website,
      rating: b.rating,
      reviewCount: b.reviewCount,
    }),
  );

  return NextResponse.json({
    results: catalogResults,
    total: catalogTotal,
    limit,
    source: "catalog" as const,
    googleEnabled,
    message: googleEnabled
      ? undefined
      : "Add GOOGLE_MAPS_API_KEY to .env.local for live Google Places search.",
  });
}
