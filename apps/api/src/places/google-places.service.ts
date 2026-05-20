import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  configureGooglePlacesApiKey,
  getGooglePlaceDetails,
  searchGooglePlaces,
  type GooglePlacesSearchResult,
  type PlaceImportPayload,
} from "@am2/shared";

@Injectable()
export class GooglePlacesService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    configureGooglePlacesApiKey(() => this.apiKey());
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey());
  }

  private apiKey(): string | undefined {
    return (
      this.config.get<string>("GOOGLE_MAPS_API_KEY") ??
      this.config.get<string>("GOOGLE_PLACES_API_KEY")
    );
  }

  search(
    params: Parameters<typeof searchGooglePlaces>[0],
  ): Promise<GooglePlacesSearchResult> {
    return searchGooglePlaces(params);
  }

  getPlaceDetails(placeId: string): Promise<PlaceImportPayload | null> {
    return getGooglePlaceDetails(placeId);
  }
}
