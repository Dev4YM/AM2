import { Injectable } from "@nestjs/common";
import type { BusinessDataTier, PlaceReview } from "@am2/shared";
import { CollectorMetricsService } from "../../reputation/collector-metrics.service";

const PLACES_API = "https://places.googleapis.com/v1";

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "primaryType",
  "types",
  "nationalPhoneNumber",
  "websiteUri",
  "reviews",
  "addressComponents",
  "googleMapsUri",
  "currentOpeningHours",
  "regularOpeningHours",
].join(",");

function apiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
}

function formatType(type?: string): string {
  if (!type) return "Business";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseAddressComponents(
  components?: { longText?: string; shortText?: string; types?: string[] }[],
) {
  let city: string | undefined;
  let region: string | undefined;
  let country: string | undefined;
  for (const c of components ?? []) {
    const types = c.types ?? [];
    if (types.includes("locality")) city = c.longText;
    if (types.includes("administrative_area_level_1"))
      region = c.shortText ?? c.longText;
    if (types.includes("country")) country = c.shortText;
  }
  return { city, region, country };
}

function formatHours(place: {
  currentOpeningHours?: { weekdayDescriptions?: string[] };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}): string | null {
  const lines =
    place.currentOpeningHours?.weekdayDescriptions ??
    place.regularOpeningHours?.weekdayDescriptions;
  if (!lines?.length) return null;
  return lines.join("; ");
}

export interface GooglePlacesRawDetails {
  businessData: BusinessDataTier | null;
  reviews: PlaceReview[];
  rating?: number | null;
  reviewCount?: number;
}

@Injectable()
export class GooglePlacesCollector {
  constructor(private readonly metrics: CollectorMetricsService) {}

  async fetchDetails(placeId: string): Promise<GooglePlacesRawDetails | null> {
    const started = Date.now();
    const key = apiKey();
    if (!key) {
      this.metrics.record({
        collector: "google_places",
        success: false,
        durationMs: Date.now() - started,
        error: "GOOGLE_MAPS_API_KEY not configured",
      });
      return null;
    }

    try {
      const res = await fetch(`${PLACES_API}/places/${placeId}`, {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": DETAILS_FIELD_MASK,
        },
      });

      if (!res.ok) {
        const err = await res.text();
        this.metrics.record({
          collector: "google_places",
          success: false,
          durationMs: Date.now() - started,
          error: `HTTP ${res.status}: ${err.slice(0, 200)}`,
        });
        return null;
      }

      const place = (await res.json()) as {
        id?: string;
        name?: string;
        location?: { latitude?: number; longitude?: number };
        addressComponents?: {
          longText?: string;
          shortText?: string;
          types?: string[];
        }[];
        reviews?: unknown[];
        displayName?: { text?: string };
        formattedAddress?: string;
        nationalPhoneNumber?: string;
        websiteUri?: string;
        primaryType?: string;
        types?: string[];
        rating?: number;
        userRatingCount?: number;
        googleMapsUri?: string;
        currentOpeningHours?: { weekdayDescriptions?: string[] };
        regularOpeningHours?: { weekdayDescriptions?: string[] };
      };
      const id =
        place.id?.replace(/^places\//, "") ??
        place.name?.replace(/^places\//, "");
      const lat = place.location?.latitude;
      const lng = place.location?.longitude;
      if (!id || lat == null || lng == null) {
        this.metrics.record({
          collector: "google_places",
          success: false,
          durationMs: Date.now() - started,
          error: "missing place id or coordinates",
        });
        return null;
      }

      const { city, region, country } = parseAddressComponents(
        place.addressComponents,
      );

      const reviews = (place.reviews ?? []).slice(0, 10).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => ({
          author: r.authorAttribution?.displayName ?? "Anonymous",
          rating: r.rating ?? 0,
          text: r.text?.text ?? r.originalText?.text ?? "",
          date: r.publishTime?.slice(0, 10) ?? "",
        }),
      );

      const businessData: BusinessDataTier = {
        name: place.displayName?.text ?? "Unknown",
        address: place.formattedAddress ?? "",
        landline: place.nationalPhoneNumber ?? null,
        website: place.websiteUri ?? null,
        hours: formatHours(place),
        category: formatType(place.primaryType ?? place.types?.[0]),
        coordinates: { lat, lng },
        city: city ?? null,
        region: region ?? null,
        country: country ?? null,
        rating: place.rating ?? null,
        reviewCount: place.userRatingCount ?? null,
        googleMapsUri: place.googleMapsUri ?? null,
        source: "google_places",
      };

      const fieldsPopulated = [
        businessData.name,
        businessData.address,
        businessData.landline,
        businessData.website,
        businessData.hours,
        businessData.category,
      ].filter(Boolean).length;

      this.metrics.record({
        collector: "google_places",
        success: true,
        durationMs: Date.now() - started,
        fieldsPopulated,
      });

      return {
        businessData,
        reviews,
        rating: place.rating ?? null,
        reviewCount: place.userRatingCount ?? 0,
      };
    } catch (e) {
      this.metrics.record({
        collector: "google_places",
        success: false,
        durationMs: Date.now() - started,
        error: e instanceof Error ? e.message : String(e),
      });
      return null;
    }
  }
}
