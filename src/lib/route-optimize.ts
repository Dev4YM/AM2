/** Haversine distance in km between two lat/lng points. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface RouteStop {
  id: string;
  lat: number;
  lng: number;
}

/** Greedy nearest-neighbor visit order from optional start index. */
export function optimizeRouteOrder<T extends RouteStop>(
  stops: T[],
  startId?: string,
): T[] {
  if (stops.length <= 1) return [...stops];

  const remaining = new Map(stops.map((s) => [s.id, s]));
  const ordered: T[] = [];

  let current: T | undefined =
    startId ? remaining.get(startId) : stops[0];
  if (!current) current = stops[0];

  remaining.delete(current.id);
  ordered.push(current);

  while (remaining.size > 0) {
    let nearest: T | null = null;
    let nearestDist = Infinity;

    for (const candidate of remaining.values()) {
      const d = distanceKm(
        current.lat,
        current.lng,
        candidate.lat,
        candidate.lng,
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearest = candidate;
      }
    }

    if (!nearest) break;
    ordered.push(nearest);
    remaining.delete(nearest.id);
    current = nearest;
  }

  return ordered;
}
