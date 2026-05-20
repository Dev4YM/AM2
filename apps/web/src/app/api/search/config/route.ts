import { NextResponse } from "next/server";
import { isGooglePlacesConfigured } from "@/lib/google-places";

export async function GET() {
  return NextResponse.json({
    placesEnabled: isGooglePlacesConfigured(),
    mapsPublicKey: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
  });
}
