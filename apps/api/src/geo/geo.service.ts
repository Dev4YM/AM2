import { Injectable } from "@nestjs/common";
import {
  getCitiesForProvince,
  getProvincesForCountry,
  getProvincesForRegion,
  getProvince,
  getRegionsForCountry,
} from "@am2/shared";
import { COUNTRIES, getCountry } from "./countries.data";

@Injectable()
export class GeoService {
  listCountries() {
    return COUNTRIES.map((c) => ({
      code: c.code,
      name: c.name,
      center: c.center,
      zoom: c.zoom,
    }));
  }

  getCountry(code: string) {
    const country = getCountry(code);
    if (!country) return null;
    return {
      code: country.code,
      name: country.name,
      center: country.center,
      zoom: country.zoom,
    };
  }

  listRegions(countryCode: string) {
    return getRegionsForCountry(countryCode.toUpperCase());
  }

  listProvinces(countryCode: string, regionId?: string) {
    const code = countryCode.toUpperCase();
    if (regionId) {
      return getProvincesForRegion(code, regionId);
    }
    return getProvincesForCountry(code);
  }

  listCities(countryCode: string, provinceId?: string) {
    if (!provinceId) return [];
    const province = getProvince(provinceId);
    if (!province) return [];
    return getCitiesForProvince(provinceId).map((c) => ({
      id: c.id,
      name: c.name,
      provinceId: c.provinceId,
      center: c.center,
      countryCode: countryCode.toUpperCase(),
    }));
  }
}
