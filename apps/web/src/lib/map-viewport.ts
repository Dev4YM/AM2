import { COUNTRIES, getCountry } from "@/lib/countries";
import type { LandAnchor, MapBounds } from "@am2/shared";
import {
  isViewportTooWideForPlaces,
  searchBoundsAroundAnchor,
} from "@am2/shared";

export type { LandAnchor } from "@am2/shared";
export {
  isInvalidRectanglePlacesError,
  isViewportTooWideForPlaces,
  searchBoundsAroundAnchor,
} from "@am2/shared";

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

function isPointInBounds(lat: number, lng: number, bounds: MapBounds): boolean {
  if (lat < bounds.south || lat > bounds.north) return false;
  if (bounds.west <= bounds.east) {
    return lng >= bounds.west && lng <= bounds.east;
  }
  return lng >= bounds.west || lng <= bounds.east;
}

function viewportCenter(bounds: MapBounds): { lat: number; lng: number } {
  let lng = (bounds.west + bounds.east) / 2;
  if (bounds.east < bounds.west) {
    lng = (((bounds.west + bounds.east + 360) / 2) % 360) - 180;
  }
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng,
  };
}

/** Ensure bounds sent to Google Places are within API limits (country-aware land anchor). */
export function clampBoundsForPlacesSearch(
  bounds: MapBounds,
  countryCode: string,
): MapBounds {
  if (!isViewportTooWideForPlaces(bounds)) {
    return {
      north: Number(bounds.north.toFixed(6)),
      south: Number(bounds.south.toFixed(6)),
      east: Number(bounds.east.toFixed(6)),
      west: Number(bounds.west.toFixed(6)),
    };
  }
  const anchor = resolveNearestLandAnchor(bounds, countryCode);
  return searchBoundsAroundAnchor(anchor);
}

export function resolveNearestLandAnchor(
  viewport: MapBounds,
  preferredCountryCode: string,
): LandAnchor {
  const preferred = getCountry(preferredCountryCode);
  const inViewport = COUNTRIES.filter((c) =>
    isPointInBounds(c.center.lat, c.center.lng, viewport),
  );

  if (preferred && inViewport.some((c) => c.code === preferredCountryCode)) {
    return {
      lat: preferred.center.lat,
      lng: preferred.center.lng,
      zoom: preferred.zoom,
      label: preferred.name,
    };
  }

  if (inViewport.length > 0) {
    const centroid = inViewport.reduce(
      (acc, c) => ({
        lat: acc.lat + c.center.lat / inViewport.length,
        lng: acc.lng + c.center.lng / inViewport.length,
      }),
      { lat: 0, lng: 0 },
    );

    let best = inViewport[0]!;
    let bestDist = Infinity;
    for (const c of inViewport) {
      const d = haversineMeters(centroid.lat, centroid.lng, c.center.lat, c.center.lng);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }

    return {
      lat: best.center.lat,
      lng: best.center.lng,
      zoom: best.zoom,
      label: best.name,
    };
  }

  const vc = viewportCenter(viewport);
  let nearest: (typeof COUNTRIES)[number] = COUNTRIES[0]!;
  let nearestDist = Infinity;
  for (const c of COUNTRIES) {
    const d = haversineMeters(vc.lat, vc.lng, c.center.lat, c.center.lng);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = c;
    }
  }

  if (preferred) {
    const dPref = haversineMeters(
      vc.lat,
      vc.lng,
      preferred.center.lat,
      preferred.center.lng,
    );
    if (dPref < nearestDist * 1.35) {
      return {
        lat: preferred.center.lat,
        lng: preferred.center.lng,
        zoom: preferred.zoom,
        label: preferred.name,
      };
    }
  }

  return {
    lat: nearest.center.lat,
    lng: nearest.center.lng,
    zoom: nearest.zoom,
    label: nearest.name,
  };
}
