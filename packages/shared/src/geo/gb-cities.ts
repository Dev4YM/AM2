import type { GeoCity } from "./types";

function c(provinceCode: string, name: string, lat: number, lng: number): GeoCity {
  return {
    id: `GB-${provinceCode}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    provinceId: `GB-${provinceCode}`,
    center: { lat, lng },
  };
}

export const GB_CITIES: GeoCity[] = [
  c("ENG", "London", 51.5074, -0.1278),
  c("ENG", "Manchester", 53.4808, -2.2426),
  c("ENG", "Birmingham", 52.4862, -1.8904),
  c("ENG", "Leeds", 53.8008, -1.5491),
  c("ENG", "Bristol", 51.4545, -2.5879),
  c("SCT", "Edinburgh", 55.9533, -3.1883),
  c("SCT", "Glasgow", 55.8642, -4.2518),
  c("WLS", "Cardiff", 51.4816, -3.1791),
  c("WLS", "Swansea", 51.6214, -3.9436),
  c("NIR", "Belfast", 54.5973, -5.9301),
];
