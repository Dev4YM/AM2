/** ISO 3166-1 alpha-2 — used for Google Places regionCode + geo hierarchy */
export const COUNTRIES = [
  { code: "US", name: "United States", center: { lat: 39.8283, lng: -98.5795 }, zoom: 4 },
  { code: "CA", name: "Canada", center: { lat: 56.1304, lng: -106.3468 }, zoom: 4 },
  { code: "GB", name: "United Kingdom", center: { lat: 55.3781, lng: -3.436 }, zoom: 5 },
  { code: "FR", name: "France", center: { lat: 46.2276, lng: 2.2137 }, zoom: 5 },
  { code: "DE", name: "Germany", center: { lat: 51.1657, lng: 10.4515 }, zoom: 5 },
  { code: "ES", name: "Spain", center: { lat: 40.4637, lng: -3.7492 }, zoom: 5 },
  { code: "IT", name: "Italy", center: { lat: 41.8719, lng: 12.5674 }, zoom: 5 },
  { code: "AU", name: "Australia", center: { lat: -25.2744, lng: 133.7751 }, zoom: 4 },
  { code: "BR", name: "Brazil", center: { lat: -14.235, lng: -51.9253 }, zoom: 4 },
  { code: "MX", name: "Mexico", center: { lat: 23.6345, lng: -102.5528 }, zoom: 5 },
  { code: "JP", name: "Japan", center: { lat: 36.2048, lng: 138.2529 }, zoom: 5 },
  { code: "IN", name: "India", center: { lat: 20.5937, lng: 78.9629 }, zoom: 4 },
] as const;

export function getCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}
