import type { GeoCity } from "./types";

function c(provinceCode: string, name: string, lat: number, lng: number): GeoCity {
  return {
    id: `FR-${provinceCode}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    provinceId: `FR-${provinceCode}`,
    center: { lat, lng },
  };
}

export const FR_CITIES: GeoCity[] = [
  c("75", "Paris", 48.8566, 2.3522),
  c("69", "Lyon", 45.764, 4.8357),
  c("13", "Marseille", 43.2965, 5.3698),
  c("33", "Bordeaux", 44.8378, -0.5792),
  c("31", "Toulouse", 43.6047, 1.4442),
  c("59", "Lille", 50.6292, 3.0573),
  c("35", "Rennes", 48.1173, -1.6778),
  c("67", "Strasbourg", 48.5734, 7.7521),
];
