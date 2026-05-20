import type { FinderBusiness, MapBounds, PlaceImportPayload } from "./finder";
import {
  buildGeoLocationLabel,
  resolveGeoSearchContext,
  resolveSearchAnchors,
  type GeoSearchContext,
} from "./geo";
import { clampBoundsForPlacesSearch, searchBoundsAroundAnchor } from "./map-viewport";
import {
  DEFAULT_REACHING_CAP,
  MAX_REACHING_CAP,
  PLACES_PAGE_SIZE,
} from "./search";

const PLACES_API = "https://places.googleapis.com/v1";

export { DEFAULT_REACHING_CAP, MAX_REACHING_CAP, PLACES_PAGE_SIZE } from "./search";

const MAX_PAGES_PER_ANCHOR = 2;
const MAX_CONCURRENT_ANCHORS = 4;

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.primaryType",
  "places.types",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.currentOpeningHours",
  "nextPageToken",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "primaryType",
  "types",
  "nationalPhoneNumber",
  "websiteUri",
  "reviews",
  "addressComponents",
  "googleMapsUri",
].join(",");

export interface GooglePlacesSearchMeta {
  capped: boolean;
  totalFetched: number;
  anchorCount: number;
  requestedLimit: number;
}

export interface GooglePlacesSearchResult {
  results: FinderBusiness[];
  meta: GooglePlacesSearchMeta;
}

export type GooglePlacesApiKeyProvider = () => string | undefined;

let apiKeyProvider: GooglePlacesApiKeyProvider = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;

export function configureGooglePlacesApiKey(provider: GooglePlacesApiKeyProvider): void {
  apiKeyProvider = provider;
}

function apiKey(): string | undefined {
  return apiKeyProvider();
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(apiKey());
}

function countryDisplayName(countryCode: string): string {
  const names: Record<string, string> = {
    US: "United States",
    CA: "Canada",
    GB: "United Kingdom",
  };
  return names[countryCode] ?? countryCode;
}

function formatType(type?: string): string {
  if (!type) return "Business";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseAddressComponents(
  components?: { longText?: string; shortText?: string; types?: string[] }[],
) {
  let city: string | undefined;
  let region: string | undefined;
  let country: string | undefined;
  for (const c of components ?? []) {
    const types = c.types ?? [];
    if (types.includes("locality")) city = c.longText;
    if (types.includes("administrative_area_level_1")) region = c.shortText ?? c.longText;
    if (types.includes("country")) country = c.shortText;
  }
  return { city, region, country };
}

function normalizeBounds(bounds: MapBounds): MapBounds {
  let { north, south, east, west } = bounds;
  if (north < south) [north, south] = [south, north];
  return {
    north: Number(north.toFixed(6)),
    south: Number(south.toFixed(6)),
    east: Number(east.toFixed(6)),
    west: Number(west.toFixed(6)),
  };
}

function rectangleRestriction(bounds: MapBounds) {
  const b = normalizeBounds(bounds);
  return {
    rectangle: {
      low: { latitude: b.south, longitude: b.west },
      high: { latitude: b.north, longitude: b.east },
    },
  };
}

function circleRestriction(bounds: MapBounds) {
  const b = normalizeBounds(bounds);
  const center = boundsCenter(b);
  return {
    circle: {
      center: { latitude: center.lat, longitude: center.lng },
      radius: clampRadius(boundsRadiusMeters(b)),
    },
  };
}

function clampRadius(meters: number): number {
  return Math.min(50_000, Math.max(1, Math.round(meters)));
}

function boundsCenter(bounds: MapBounds) {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function boundsRadiusMeters(bounds: MapBounds): number {
  const center = boundsCenter(bounds);
  const corners: [number, number][] = [
    [bounds.north, bounds.east],
    [bounds.north, bounds.west],
    [bounds.south, bounds.east],
    [bounds.south, bounds.west],
  ];
  let max = 1;
  for (const [lat, lng] of corners) {
    max = Math.max(max, haversineMeters(center.lat, center.lng, lat, lng));
  }
  return max;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlace(place: any, countryCode: string): FinderBusiness | null {
  const placeId = place.id?.replace(/^places\//, "") ?? place.name?.replace(/^places\//, "");
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!placeId || lat == null || lng == null) return null;

  const { city, region, country } = parseAddressComponents(place.addressComponents);

  return {
    id: `google:${placeId}`,
    source: "google",
    placeId,
    name: place.displayName?.text ?? "Unknown",
    category: formatType(place.primaryType ?? place.types?.[0]),
    address: place.formattedAddress ?? "",
    city,
    region,
    country: country ?? countryCode,
    lat,
    lng,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    googleMapsUri: place.googleMapsUri,
    openNow: place.currentOpeningHours?.openNow ?? place.businessStatus === "OPERATIONAL",
  };
}

interface RawTextSearchResponse {
  places?: unknown[];
  nextPageToken?: string;
}

async function runPlacesTextSearch(
  body: Record<string, unknown>,
  countryCode: string,
): Promise<{ places: FinderBusiness[]; nextPageToken?: string }> {
  const key = apiKey();
  if (!key) return { places: [] };

  const res = await fetch(`${PLACES_API}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places search failed (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as RawTextSearchResponse;
  const places = (data.places ?? [])
    .map((p) => mapPlace(p, countryCode))
    .filter((b): b is FinderBusiness => Boolean(b));

  return { places, nextPageToken: data.nextPageToken };
}

async function runPlacesTextSearchPaginated(
  baseBody: Record<string, unknown>,
  countryCode: string,
  maxPages: number,
): Promise<FinderBusiness[]> {
  const collected: FinderBusiness[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const body = pageToken ? { ...baseBody, pageToken } : baseBody;
    const { places, nextPageToken } = await runPlacesTextSearch(body, countryCode);
    collected.push(...places);
    if (!nextPageToken || places.length === 0) break;
    pageToken = nextPageToken;
  }

  return collected;
}

async function runNearbySearch(
  body: Record<string, unknown>,
  countryCode: string,
): Promise<FinderBusiness[]> {
  const key = apiKey();
  if (!key) return [];

  const res = await fetch(`${PLACES_API}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK.replace(",nextPageToken", ""),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Nearby search failed (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as { places?: unknown[] };
  return (data.places ?? [])
    .map((p) => mapPlace(p, countryCode))
    .filter((b): b is FinderBusiness => Boolean(b));
}

function dedupeAndSort(items: FinderBusiness[], limit: number): FinderBusiness[] {
  const seen = new Set<string>();
  const unique: FinderBusiness[] = [];
  for (const b of items) {
    const key = b.placeId ?? b.id;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(b);
  }
  unique.sort((a, b) => {
    const ra = a.rating ?? 0;
    const rb = b.rating ?? 0;
    if (rb !== ra) return rb - ra;
    return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
  });
  return unique.slice(0, limit);
}

function clampTotalLimit(limit?: number): number {
  const n = limit ?? DEFAULT_REACHING_CAP;
  return Math.min(MAX_REACHING_CAP, Math.max(PLACES_PAGE_SIZE, Math.round(n)));
}

function buildTextQuery(params: {
  query?: string;
  category?: string;
  geoLabel: string;
  countryName: string;
}): string {
  if (params.query?.trim()) {
    const loc = params.geoLabel || params.countryName;
    return loc ? `${params.query.trim()} in ${loc}` : params.query.trim();
  }
  const categoryLabel = params.category ? formatType(params.category) : "businesses";
  const loc = params.geoLabel || params.countryName;
  return loc ? `${categoryLabel} in ${loc}` : categoryLabel;
}

async function searchAtAnchor(
  anchor: { lat: number; lng: number; label: string },
  params: {
    textQuery: string;
    countryCode: string;
    category?: string;
    provinceBounds?: MapBounds;
    maxPages: number;
  },
): Promise<FinderBusiness[]> {
  const anchorBounds = searchBoundsAroundAnchor(anchor);
  const raw = params.provinceBounds
    ? intersectBounds(anchorBounds, params.provinceBounds)
    : anchorBounds;
  const box = clampBoundsForPlacesSearch(raw);

  const textBody: Record<string, unknown> = {
    textQuery: params.textQuery,
    regionCode: params.countryCode,
    languageCode: "en",
    maxResultCount: PLACES_PAGE_SIZE,
    locationRestriction: rectangleRestriction(box),
    rankPreference: "RELEVANCE",
  };
  if (params.category) textBody.includedType = params.category;

  return runPlacesTextSearchPaginated(textBody, params.countryCode, params.maxPages);
}

/** Prefer overlap of anchor box with province when both exist. */
function intersectBounds(a: MapBounds, b: MapBounds): MapBounds {
  const north = Math.min(a.north, b.north);
  const south = Math.max(a.south, b.south);
  const east = Math.min(a.east, b.east);
  const west = Math.max(a.west, b.west);
  if (north <= south || east <= west) return a;
  return { north, south, east, west };
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const i = index++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]!);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, () => worker()),
  );
  return results;
}

async function reachingTextSearch(
  ctx: GeoSearchContext,
  params: {
    query?: string;
    category?: string;
    countryCode: string;
    limit: number;
  },
): Promise<{ results: FinderBusiness[]; anchorCount: number }> {
  const geoLabel = buildGeoLocationLabel(ctx);
  const textQuery = buildTextQuery({
    query: params.query,
    category: params.category,
    geoLabel,
    countryName: countryDisplayName(params.countryCode),
  });

  const anchors = resolveSearchAnchors(ctx);
  if (anchors.length === 0) {
    const body: Record<string, unknown> = {
      textQuery,
      regionCode: params.countryCode,
      languageCode: "en",
      maxResultCount: PLACES_PAGE_SIZE,
      rankPreference: "RELEVANCE",
    };
    if (params.category) body.includedType = params.category;
    const single = await runPlacesTextSearchPaginated(
      body,
      params.countryCode,
      Math.ceil(params.limit / PLACES_PAGE_SIZE),
    );
    return { results: single, anchorCount: 1 };
  }

  const pagesPerAnchor = Math.max(1, Math.min(MAX_PAGES_PER_ANCHOR, Math.ceil(params.limit / (anchors.length * PLACES_PAGE_SIZE))));

  const batches = await mapPool(anchors, MAX_CONCURRENT_ANCHORS, (anchor) =>
    searchAtAnchor(anchor, {
      textQuery,
      countryCode: params.countryCode,
      category: params.category,
      provinceBounds: ctx.province?.bounds,
      maxPages: pagesPerAnchor,
    }),
  );

  return { results: batches.flat(), anchorCount: anchors.length };
}

export async function searchGooglePlaces(params: {
  query?: string;
  category?: string;
  countryCode: string;
  city?: string;
  regionId?: string;
  provinceId?: string;
  cityId?: string;
  bounds?: MapBounds;
  limit?: number;
}): Promise<GooglePlacesSearchResult> {
  const key = apiKey();
  if (!key) {
    return {
      results: [],
      meta: {
        capped: false,
        totalFetched: 0,
        anchorCount: 0,
        requestedLimit: params.limit ?? DEFAULT_REACHING_CAP,
      },
    };
  }

  const totalLimit = clampTotalLimit(params.limit);
  const ctx = resolveGeoSearchContext({
    countryCode: params.countryCode,
    regionId: params.regionId,
    provinceId: params.provinceId,
    cityId: params.cityId,
  });

  // Legacy free-text city when no structured cityId
  if (!ctx.city && params.city?.trim()) {
    const textQuery = buildTextQuery({
      query: params.query,
      category: params.category,
      geoLabel: params.city.trim(),
      countryName: countryDisplayName(params.countryCode),
    });
    const body: Record<string, unknown> = {
      textQuery,
      regionCode: params.countryCode,
      languageCode: "en",
      maxResultCount: PLACES_PAGE_SIZE,
      rankPreference: "RELEVANCE",
    };
    if (params.category) body.includedType = params.category;
    const pages = Math.ceil(totalLimit / PLACES_PAGE_SIZE);
    const results = dedupeAndSort(
      await runPlacesTextSearchPaginated(body, params.countryCode, pages),
      totalLimit,
    );
    return {
      results,
      meta: {
        capped: results.length >= totalLimit,
        totalFetched: results.length,
        anchorCount: 1,
        requestedLimit: totalLimit,
      },
    };
  }

  const geoLabel = buildGeoLocationLabel(ctx);
  const textQuery = buildTextQuery({
    query: params.query,
    category: params.category,
    geoLabel: geoLabel || (params.city ?? ""),
    countryName: countryDisplayName(params.countryCode),
  });

  if (params.bounds) {
    const box = clampBoundsForPlacesSearch(normalizeBounds(params.bounds));
    const perRequest = Math.min(PLACES_PAGE_SIZE, totalLimit);

    const nearbyBody: Record<string, unknown> = {
      maxResultCount: perRequest,
      locationRestriction: circleRestriction(box),
      rankPreference: "POPULARITY",
    };
    if (params.category) nearbyBody.includedTypes = [params.category];

    let results = await runNearbySearch(nearbyBody, params.countryCode);

    const textBody: Record<string, unknown> = {
      textQuery: textQuery.trim(),
      regionCode: params.countryCode,
      languageCode: "en",
      maxResultCount: perRequest,
      locationRestriction: rectangleRestriction(box),
      rankPreference: "RELEVANCE",
    };
    if (params.category) textBody.includedType = params.category;
    const textResults = await runPlacesTextSearchPaginated(
      textBody,
      params.countryCode,
      Math.min(MAX_PAGES_PER_ANCHOR, Math.ceil(totalLimit / PLACES_PAGE_SIZE)),
    );
    results = [...results, ...textResults];

    // Province-level reaching: extra anchors when viewport/box is wide or few results
    if (ctx.province && results.length < totalLimit) {
      const { results: anchorResults, anchorCount } = await reachingTextSearch(ctx, {
        ...params,
        limit: totalLimit,
      });
      results = [...results, ...anchorResults];
      const deduped = dedupeAndSort(results, totalLimit);
      return {
        results: deduped,
        meta: {
          capped: deduped.length >= totalLimit,
          totalFetched: deduped.length,
          anchorCount,
          requestedLimit: totalLimit,
        },
      };
    }

    const deduped = dedupeAndSort(results, totalLimit);
    return {
      results: deduped,
      meta: {
        capped: deduped.length >= totalLimit,
        totalFetched: deduped.length,
        anchorCount: 1,
        requestedLimit: totalLimit,
      },
    };
  }

  // Geo-scoped reaching text search (province / city / region context)
  const { results: raw, anchorCount } = await reachingTextSearch(ctx, {
    query: params.query,
    category: params.category,
    countryCode: params.countryCode,
    limit: totalLimit,
  });

  const deduped = dedupeAndSort(raw, totalLimit);
  return {
    results: deduped,
    meta: {
      capped: deduped.length >= totalLimit,
      totalFetched: raw.length,
      anchorCount,
      requestedLimit: totalLimit,
    },
  };
}

export async function getGooglePlaceDetails(
  placeId: string,
): Promise<PlaceImportPayload | null> {
  const key = apiKey();
  if (!key) return null;

  const res = await fetch(`${PLACES_API}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
    },
  });

  if (!res.ok) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const place = (await res.json()) as any;
  const base = mapPlace(place, "");
  if (!base?.placeId) return null;

  const reviews = (place.reviews ?? []).slice(0, 10).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => ({
      author: r.authorAttribution?.displayName ?? "Anonymous",
      rating: r.rating ?? 0,
      text: r.text?.text ?? r.originalText?.text ?? "",
      date: r.publishTime?.slice(0, 10) ?? "",
    }),
  );

  return {
    placeId: base.placeId,
    name: base.name,
    category: base.category,
    address: base.address,
    lat: base.lat,
    lng: base.lng,
    phone: base.phone,
    website: base.website,
    rating: base.rating,
    reviewCount: base.reviewCount,
    reviews,
  };
}
