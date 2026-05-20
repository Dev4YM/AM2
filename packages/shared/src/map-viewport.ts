import type { LandAnchor, MapBounds } from "./finder";

export const MAX_PLACES_LNG_SPAN = 179.5;
export const MAX_PLACES_LAT_SPAN = 85;

export function longitudeSpanDegrees(bounds: MapBounds): number {
  const { west, east } = bounds;
  if (east >= west) return east - west;
  return 360 - west + east;
}

export function isViewportTooWideForPlaces(bounds: MapBounds): boolean {
  const latSpan = bounds.north - bounds.south;
  const lngSpan = longitudeSpanDegrees(bounds);
  return lngSpan >= MAX_PLACES_LNG_SPAN || latSpan >= MAX_PLACES_LAT_SPAN;
}

export function isInvalidRectanglePlacesError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("rectangle viewport cannot be wider than 180") ||
    m.includes("invalid rectangle viewport") ||
    m.includes("empty latitude range")
  );
}

function boundsCenter(bounds: MapBounds): { lat: number; lng: number } {
  let lng = (bounds.west + bounds.east) / 2;
  if (bounds.east < bounds.west) {
    lng = (((bounds.west + bounds.east + 360) / 2) % 360) - 180;
  }
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng,
  };
}

export function searchBoundsAroundAnchor(anchor: Pick<LandAnchor, "lat" | "lng">): MapBounds {
  const latHalf = 5;
  const lngHalf = 6;
  return {
    north: Number(Math.min(85, anchor.lat + latHalf).toFixed(6)),
    south: Number(Math.max(-85, anchor.lat - latHalf).toFixed(6)),
    east: Number(Math.min(180, anchor.lng + lngHalf).toFixed(6)),
    west: Number(Math.max(-180, anchor.lng - lngHalf).toFixed(6)),
  };
}

/** Shrink bounds that exceed Google Places rectangle limits. */
export function clampBoundsForPlacesSearch(bounds: MapBounds): MapBounds {
  if (!isViewportTooWideForPlaces(bounds)) {
    return {
      north: Number(bounds.north.toFixed(6)),
      south: Number(bounds.south.toFixed(6)),
      east: Number(bounds.east.toFixed(6)),
      west: Number(bounds.west.toFixed(6)),
    };
  }
  const center = boundsCenter(bounds);
  return searchBoundsAroundAnchor(center);
}
