import type { GeoProvince } from "./types";

function p(
  code: string,
  name: string,
  regionId: string,
  center: { lat: number; lng: number },
): GeoProvince {
  const pad = 1.2;
  return {
    id: `DE-${code}`,
    code,
    name,
    regionId,
    countryCode: "DE",
    center,
    bounds: {
      north: center.lat + pad,
      south: center.lat - pad,
      east: center.lng + pad,
      west: center.lng - pad,
    },
  };
}

export const DE_PROVINCES: GeoProvince[] = [
  p("BW", "Baden-Württemberg", "de-south", { lat: 48.6616, lng: 9.3501 }),
  p("BY", "Bavaria", "de-south", { lat: 48.7904, lng: 11.4979 }),
  p("BE", "Berlin", "de-east", { lat: 52.52, lng: 13.405 }),
  p("BB", "Brandenburg", "de-east", { lat: 52.4125, lng: 12.5316 }),
  p("HB", "Bremen", "de-north", { lat: 53.0793, lng: 8.8017 }),
  p("HH", "Hamburg", "de-north", { lat: 53.5511, lng: 9.9937 }),
  p("HE", "Hesse", "de-west", { lat: 50.6521, lng: 9.1624 }),
  p("NI", "Lower Saxony", "de-north", { lat: 52.6367, lng: 9.8451 }),
  p("NW", "North Rhine-Westphalia", "de-west", { lat: 51.4332, lng: 7.6616 }),
  p("RP", "Rhineland-Palatinate", "de-west", { lat: 50.1183, lng: 7.3089 }),
  p("SL", "Saarland", "de-west", { lat: 49.3964, lng: 7.023 }),
  p("SN", "Saxony", "de-east", { lat: 51.1045, lng: 13.2017 }),
  p("ST", "Saxony-Anhalt", "de-east", { lat: 51.9503, lng: 11.6923 }),
  p("SH", "Schleswig-Holstein", "de-north", { lat: 54.2194, lng: 9.6961 }),
  p("TH", "Thuringia", "de-east", { lat: 50.9848, lng: 11.0299 }),
];
