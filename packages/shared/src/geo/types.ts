import type { MapBounds } from "../finder";

/** Census-style macro region within a country (e.g. US West, Midwest). */
export interface GeoRegion {
  id: string;
  name: string;
  countryCode: string;
}

/** State, province, or equivalent first-level subdivision. */
export interface GeoProvince {
  id: string;
  name: string;
  /** Short code (e.g. CO, ON). */
  code: string;
  regionId: string;
  countryCode: string;
  center: { lat: number; lng: number };
  /** Approximate bounds for map fit and grid search. */
  bounds: MapBounds;
}

export interface GeoCity {
  id: string;
  name: string;
  provinceId: string;
  center: { lat: number; lng: number };
}

export interface GeoSearchContext {
  countryCode: string;
  region?: GeoRegion;
  province?: GeoProvince;
  city?: GeoCity;
}
