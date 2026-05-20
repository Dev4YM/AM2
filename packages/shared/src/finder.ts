export type FinderSource = "google" | "catalog";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FinderBusiness {
  id: string;
  source: FinderSource;
  placeId?: string;
  name: string;
  category: string;
  address: string;
  city?: string;
  region?: string;
  country?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  openNow?: boolean;
  googleMapsUri?: string;
  reviews?: { author: string; rating: number; text: string; date: string }[];
}

export interface PlaceImportPayload {
  placeId: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: { author: string; rating: number; text: string; date: string }[];
}

export interface PlaceReview {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface LandAnchor {
  lat: number;
  lng: number;
  zoom: number;
  label: string;
}
