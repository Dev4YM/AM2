import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { Public } from "../auth/public.decorator";
import { GeoService } from "./geo.service";

@Public()
@Controller("geo")
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get("countries")
  countries() {
    return { countries: this.geo.listCountries() };
  }

  @Get("countries/:code")
  country(@Param("code") code: string) {
    const country = this.geo.getCountry(code);
    if (!country) throw new NotFoundException("Country not found");
    return country;
  }

  @Get("countries/:code/regions")
  regions(@Param("code") code: string) {
    return { regions: this.geo.listRegions(code) };
  }

  @Get("countries/:code/provinces")
  provinces(
    @Param("code") code: string,
    @Query("region") region?: string,
  ) {
    return { provinces: this.geo.listProvinces(code, region) };
  }

  @Get("countries/:code/cities")
  cities(
    @Param("code") code: string,
    @Query("province") province?: string,
  ) {
    return { cities: this.geo.listCities(code, province) };
  }
}
