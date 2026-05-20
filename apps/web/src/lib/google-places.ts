import { clampBoundsForPlacesSearch as clampBoundsWithCountry } from "@/lib/map-viewport";
import {
  configureGooglePlacesApiKey,
  getGooglePlaceDetails as getPlaceDetailsShared,
  isGooglePlacesConfigured,
  searchGooglePlaces as searchGooglePlacesShared,
  type GooglePlacesSearchMeta,
  type GooglePlacesSearchResult,
} from "@am2/shared";

export {
  DEFAULT_REACHING_CAP,
  MAX_REACHING_CAP,
  PLACES_PAGE_SIZE,
} from "@am2/shared";
export type { GooglePlacesSearchMeta, GooglePlacesSearchResult };

configureGooglePlacesApiKey(
  () => process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY,
);

export { isGooglePlacesConfigured };

export async function searchGooglePlaces(
  params: Parameters<typeof searchGooglePlacesShared>[0],
): Promise<GooglePlacesSearchResult> {
  if (params.bounds) {
    const box = clampBoundsWithCountry(params.bounds, params.countryCode);
    return searchGooglePlacesShared({ ...params, bounds: box });
  }
  return searchGooglePlacesShared(params);
}

export async function getGooglePlaceDetails(placeId: string) {
  return getPlaceDetailsShared(placeId);
}
