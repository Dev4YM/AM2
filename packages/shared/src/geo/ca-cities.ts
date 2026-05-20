import type { GeoCity } from "./types";

function c(provinceCode: string, name: string, lat: number, lng: number): GeoCity {
  return {
    id: `CA-${provinceCode}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    provinceId: `CA-${provinceCode}`,
    center: { lat, lng },
  };
}

export const CA_CITIES: GeoCity[] = [
  c("BC", "Vancouver", 49.2827, -123.1207),
  c("BC", "Victoria", 48.4284, -123.3656),
  c("BC", "Surrey", 49.1913, -122.849),
  c("AB", "Calgary", 51.0447, -114.0719),
  c("AB", "Edmonton", 53.5461, -113.4938),
  c("SK", "Saskatoon", 52.1332, -106.67),
  c("SK", "Regina", 50.4452, -104.6189),
  c("MB", "Winnipeg", 49.8954, -97.1385),
  c("ON", "Toronto", 43.6532, -79.3832),
  c("ON", "Ottawa", 45.4215, -75.6972),
  c("ON", "Hamilton", 43.2557, -79.8711),
  c("ON", "Mississauga", 43.589, -79.6441),
  c("QC", "Montreal", 45.5017, -73.5673),
  c("QC", "Quebec City", 46.8139, -71.208),
  c("QC", "Laval", 45.6066, -73.7123),
  c("NB", "Moncton", 46.0878, -64.7782),
  c("NB", "Saint John", 45.2733, -66.0633),
  c("NS", "Halifax", 44.6488, -63.5752),
  c("PE", "Charlottetown", 46.2382, -63.1311),
  c("NL", "St. John's", 47.5615, -52.7126),
  c("YT", "Whitehorse", 60.7212, -135.0568),
  c("NT", "Yellowknife", 62.454, -114.3718),
  c("NU", "Iqaluit", 63.7467, -68.517),
];
