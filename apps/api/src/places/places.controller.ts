import {
  Controller,
  Get,
  Param,
  Query,
  ServiceUnavailableException,
} from "@nestjs/common";
import { GooglePlacesService } from "./google-places.service";
import { PlacesSearchDto } from "./dto/places-search.dto";

@Controller("places")
export class PlacesController {
  constructor(private readonly places: GooglePlacesService) {}

  @Get("config")
  config() {
    return { googleEnabled: this.places.isConfigured() };
  }

  @Get("search")
  async search(@Query() query: PlacesSearchDto) {
    if (!this.places.isConfigured()) {
      throw new ServiceUnavailableException(
        "Google Places is not configured. Set GOOGLE_MAPS_API_KEY.",
      );
    }

    const results = await this.places.search({
      query: query.q,
      category: query.category,
      countryCode: query.country,
      city: query.city && query.city !== "All" ? query.city : undefined,
      bounds: query.bounds,
      limit: query.limit,
    });

    return {
      results,
      source: "google" as const,
      googleEnabled: true,
      searchMode: query.bounds ? ("area" as const) : ("text" as const),
    };
  }

  @Get(":placeId")
  async details(@Param("placeId") placeId: string) {
    const details = await this.places.getPlaceDetails(placeId);
    if (!details) {
      throw new ServiceUnavailableException("Place not found or API unavailable");
    }
    return details;
  }
}
