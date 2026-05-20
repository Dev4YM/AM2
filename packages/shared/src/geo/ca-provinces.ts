import type { GeoProvince } from "./types";

function p(
  code: string,
  name: string,
  regionId: string,
  center: { lat: number; lng: number },
): GeoProvince {
  const pad = 2.5;
  return {
    id: `CA-${code}`,
    code,
    name,
    regionId,
    countryCode: "CA",
    center,
    bounds: {
      north: center.lat + pad,
      south: center.lat - pad,
      east: center.lng + pad * 1.5,
      west: center.lng - pad * 1.5,
    },
  };
}

export const CA_PROVINCES: GeoProvince[] = [
  p("BC", "British Columbia", "ca-west", { lat: 53.7267, lng: -127.6476 }),
  p("AB", "Alberta", "ca-west", { lat: 53.9333, lng: -116.5765 }),
  p("SK", "Saskatchewan", "ca-central", { lat: 52.9399, lng: -106.4509 }),
  p("MB", "Manitoba", "ca-central", { lat: 53.7609, lng: -98.8139 }),
  p("ON", "Ontario", "ca-central", { lat: 51.2538, lng: -85.3232 }),
  p("QC", "Quebec", "ca-central", { lat: 52.9399, lng: -73.5491 }),
  p("NB", "New Brunswick", "ca-atlantic", { lat: 46.5653, lng: -66.4619 }),
  p("NS", "Nova Scotia", "ca-atlantic", { lat: 44.682, lng: -63.7443 }),
  p("PE", "Prince Edward Island", "ca-atlantic", { lat: 46.5107, lng: -63.4168 }),
  p("NL", "Newfoundland and Labrador", "ca-atlantic", { lat: 53.1355, lng: -57.6604 }),
  p("YT", "Yukon", "ca-north", { lat: 64.2823, lng: -135 }),
  p("NT", "Northwest Territories", "ca-north", { lat: 64.8251, lng: -124.8457 }),
  p("NU", "Nunavut", "ca-north", { lat: 70.2998, lng: -83.1076 }),
];
