import type { GeoProvince } from "./types";

function p(
  code: string,
  name: string,
  regionId: string,
  center: { lat: number; lng: number },
): GeoProvince {
  const pad = 1.8;
  return {
    id: `GB-${code}`,
    code,
    name,
    regionId,
    countryCode: "GB",
    center,
    bounds: {
      north: center.lat + pad,
      south: center.lat - pad,
      east: center.lng + pad,
      west: center.lng - pad,
    },
  };
}

/** UK nations used as province-level for cascade. */
export const GB_PROVINCES: GeoProvince[] = [
  p("ENG", "England", "gb-england", { lat: 52.3555, lng: -1.1743 }),
  p("SCT", "Scotland", "gb-scotland", { lat: 56.4907, lng: -4.2026 }),
  p("WLS", "Wales", "gb-wales", { lat: 52.1307, lng: -3.7837 }),
  p("NIR", "Northern Ireland", "gb-ni", { lat: 54.7877, lng: -6.4923 }),
];
