import type { GeoProvince } from "./types";

function p(
  code: string,
  name: string,
  regionId: string,
  center: { lat: number; lng: number },
): GeoProvince {
  const pad = 1.5;
  return {
    id: `FR-${code}`,
    code,
    name,
    regionId,
    countryCode: "FR",
    center,
    bounds: {
      north: center.lat + pad,
      south: center.lat - pad,
      east: center.lng + pad,
      west: center.lng - pad,
    },
  };
}

/** Major departments grouped under macro regions. */
export const FR_PROVINCES: GeoProvince[] = [
  p("75", "Paris", "fr-idf", { lat: 48.8566, lng: 2.3522 }),
  p("69", "Rhône", "fr-ara", { lat: 45.764, lng: 4.8357 }),
  p("13", "Bouches-du-Rhône", "fr-paca", { lat: 43.2965, lng: 5.3698 }),
  p("33", "Gironde", "fr-naq", { lat: 44.8378, lng: -0.5792 }),
  p("31", "Haute-Garonne", "fr-occ", { lat: 43.6047, lng: 1.4442 }),
  p("59", "Nord", "fr-hdf", { lat: 50.6292, lng: 3.0573 }),
  p("35", "Ille-et-Vilaine", "fr-bre", { lat: 48.1173, lng: -1.6778 }),
  p("67", "Bas-Rhin", "fr-ges", { lat: 48.5734, lng: 7.7521 }),
];
