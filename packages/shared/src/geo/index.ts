import type { GeoCity, GeoProvince, GeoRegion, GeoSearchContext } from "./types";
import type { LandAnchor } from "../finder";
import { CA_CITIES } from "./ca-cities";
import { CA_PROVINCES } from "./ca-provinces";
import { CA_REGIONS } from "./ca-regions";
import { DE_CITIES } from "./de-cities";
import { DE_PROVINCES } from "./de-provinces";
import { DE_REGIONS } from "./de-regions";
import { FR_CITIES } from "./fr-cities";
import { FR_PROVINCES } from "./fr-provinces";
import { FR_REGIONS } from "./fr-regions";
import { GB_CITIES } from "./gb-cities";
import { GB_PROVINCES } from "./gb-provinces";
import { GB_REGIONS } from "./gb-regions";
import { US_CITIES } from "./us-cities";
import { US_PROVINCES } from "./us-provinces";
import { US_REGIONS } from "./us-regions";

export type { GeoCity, GeoProvince, GeoRegion, GeoSearchContext } from "./types";

const REGIONS_BY_COUNTRY: Record<string, GeoRegion[]> = {
  US: US_REGIONS,
  CA: CA_REGIONS,
  GB: GB_REGIONS,
  DE: DE_REGIONS,
  FR: FR_REGIONS,
};

const PROVINCES_BY_COUNTRY: Record<string, GeoProvince[]> = {
  US: US_PROVINCES,
  CA: CA_PROVINCES,
  GB: GB_PROVINCES,
  DE: DE_PROVINCES,
  FR: FR_PROVINCES,
};

const CITIES_BY_COUNTRY: Record<string, GeoCity[]> = {
  US: US_CITIES,
  CA: CA_CITIES,
  GB: GB_CITIES,
  DE: DE_CITIES,
  FR: FR_CITIES,
};

export function countryHasGeoHierarchy(countryCode: string): boolean {
  return Boolean(REGIONS_BY_COUNTRY[countryCode.toUpperCase()]);
}

export function getRegionsForCountry(countryCode: string): GeoRegion[] {
  return REGIONS_BY_COUNTRY[countryCode.toUpperCase()] ?? [];
}

export function getRegion(regionId: string): GeoRegion | undefined {
  return Object.values(REGIONS_BY_COUNTRY)
    .flat()
    .find((r) => r.id === regionId);
}

export function getProvincesForRegion(countryCode: string, regionId: string): GeoProvince[] {
  return (PROVINCES_BY_COUNTRY[countryCode.toUpperCase()] ?? []).filter(
    (p) => p.regionId === regionId,
  );
}

export function getProvincesForCountry(countryCode: string): GeoProvince[] {
  return PROVINCES_BY_COUNTRY[countryCode.toUpperCase()] ?? [];
}

export function getProvince(provinceId: string): GeoProvince | undefined {
  return Object.values(PROVINCES_BY_COUNTRY)
    .flat()
    .find((p) => p.id === provinceId);
}

export function getProvinceByCode(countryCode: string, code: string): GeoProvince | undefined {
  return getProvince(`${countryCode.toUpperCase()}-${code}`);
}

export function getCitiesForProvince(provinceId: string): GeoCity[] {
  return Object.values(CITIES_BY_COUNTRY)
    .flat()
    .filter((c) => c.provinceId === provinceId);
}

export function getCity(cityId: string): GeoCity | undefined {
  return Object.values(CITIES_BY_COUNTRY)
    .flat()
    .find((c) => c.id === cityId);
}

export const MAX_PROVINCE_SEARCH_ANCHORS = 8;

export function resolveSearchAnchors(ctx: GeoSearchContext): LandAnchor[] {
  if (ctx.city) {
    return [
      {
        lat: ctx.city.center.lat,
        lng: ctx.city.center.lng,
        zoom: 11,
        label: `${ctx.city.name}, ${ctx.province?.code ?? ""}`.trim(),
      },
    ];
  }

  if (ctx.province) {
    const cities = getCitiesForProvince(ctx.province.id);
    if (cities.length > 0) {
      return cities.slice(0, MAX_PROVINCE_SEARCH_ANCHORS).map((c) => ({
        lat: c.center.lat,
        lng: c.center.lng,
        zoom: 10,
        label: `${c.name}, ${ctx.province!.code}`,
      }));
    }
    return [
      {
        lat: ctx.province.center.lat,
        lng: ctx.province.center.lng,
        zoom: 7,
        label: ctx.province.name,
      },
    ];
  }

  return [];
}

export function buildGeoLocationLabel(ctx: GeoSearchContext): string {
  const parts: string[] = [];
  if (ctx.city) parts.push(ctx.city.name);
  if (ctx.province) parts.push(ctx.province.name);
  else if (ctx.region) parts.push(ctx.region.name);
  return parts.join(", ");
}

export function resolveGeoSearchContext(params: {
  countryCode: string;
  regionId?: string;
  provinceId?: string;
  cityId?: string;
}): GeoSearchContext {
  return {
    countryCode: params.countryCode.toUpperCase(),
    region: params.regionId ? getRegion(params.regionId) : undefined,
    province: params.provinceId ? getProvince(params.provinceId) : undefined,
    city: params.cityId ? getCity(params.cityId) : undefined,
  };
}

export function requiresProvinceSelection(countryCode: string): boolean {
  return countryHasGeoHierarchy(countryCode);
}

export function isGeoSelectionComplete(params: {
  countryCode: string;
  regionId?: string;
  provinceId?: string;
}): boolean {
  if (!requiresProvinceSelection(params.countryCode)) return true;
  return Boolean(params.regionId && params.provinceId);
}
