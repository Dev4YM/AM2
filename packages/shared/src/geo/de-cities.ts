import type { GeoCity } from "./types";

function c(provinceCode: string, name: string, lat: number, lng: number): GeoCity {
  return {
    id: `DE-${provinceCode}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    provinceId: `DE-${provinceCode}`,
    center: { lat, lng },
  };
}

export const DE_CITIES: GeoCity[] = [
  c("NW", "Cologne", 50.9375, 6.9603),
  c("NW", "Düsseldorf", 51.2277, 6.7735),
  c("BY", "Munich", 48.1351, 11.582),
  c("BE", "Berlin", 52.52, 13.405),
  c("HH", "Hamburg", 53.5511, 9.9937),
  c("HE", "Frankfurt", 50.1109, 8.6821),
  c("BW", "Stuttgart", 48.7758, 9.1829),
  c("SN", "Dresden", 51.0504, 13.7373),
  c("NI", "Hanover", 52.3759, 9.732),
  c("RP", "Mainz", 49.9929, 8.2473),
];
