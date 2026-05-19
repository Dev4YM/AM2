import catalog from "@/data/business-catalog.json";

export interface CatalogBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  hours?: string;
  email?: string;
  mobile?: string;
  social?: Record<string, string>;
  reviews?: { author: string; rating: number; text: string; date: string }[];
}

export function searchCatalog(params: {
  query?: string;
  category?: string;
  country?: string;
  region?: string;
  city?: string;
  limit?: number;
}): CatalogBusiness[] {
  const q = (params.query ?? "").toLowerCase();
  const cat = (params.category ?? "").toLowerCase();

  let results = catalog as CatalogBusiness[];

  if (params.country) {
    results = results.filter(
      (b) => b.country.toLowerCase() === params.country!.toLowerCase(),
    );
  }
  if (params.region) {
    results = results.filter(
      (b) => b.region.toLowerCase() === params.region!.toLowerCase(),
    );
  }
  if (params.city && params.city !== "All") {
    results = results.filter(
      (b) => b.city.toLowerCase() === params.city!.toLowerCase(),
    );
  }
  if (cat) {
    results = results.filter((b) =>
      b.category.toLowerCase().includes(cat),
    );
  }
  if (q) {
    results = results.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q),
    );
  }

  return results.slice(0, params.limit ?? 50);
}

export function getCatalogBusiness(id: string): CatalogBusiness | undefined {
  return (catalog as CatalogBusiness[]).find((b) => b.id === id);
}

export function getRegions(country: string): string[] {
  const set = new Set<string>();
  for (const b of catalog as CatalogBusiness[]) {
    if (b.country === country) set.add(b.region);
  }
  return [...set].sort();
}

export function getCategories(): string[] {
  const set = new Set<string>();
  for (const b of catalog as CatalogBusiness[]) {
    set.add(b.category);
  }
  return [...set].sort();
}

export function getCities(country: string, region: string): string[] {
  const set = new Set<string>();
  for (const b of catalog as CatalogBusiness[]) {
    if (b.country === country && b.region === region) set.add(b.city);
  }
  return [...set].sort();
}

export const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
];
