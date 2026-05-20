import type { FinderBusiness, MapBounds } from "./finder";

export const PLACES_PAGE_SIZE = 20;
export const DEFAULT_REACHING_CAP = 80;
export const MAX_REACHING_CAP = 100;

export type SearchMode = "text" | "area" | "reaching";

export interface SearchQueryDto {
  q?: string;
  category?: string;
  country: string;
  region?: string;
  province?: string;
  /** Structured city id (e.g. US-CO-denver) */
  city?: string;
  cityName?: string;
  limit?: number;
  source?: "google" | "catalog";
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}

export interface ReachingSearchOptions {
  /** Split viewport into grid cells for paginated "reaching" coverage */
  gridRows?: number;
  gridCols?: number;
  page?: number;
  pageSize?: number;
}

export interface SearchResultPayload {
  results: FinderBusiness[];
  source: "google" | "catalog";
  googleEnabled: boolean;
  searchMode?: SearchMode;
  message?: string;
  page?: number;
  totalPages?: number;
  gridCell?: { row: number; col: number };
  meta?: {
    capped: boolean;
    totalFetched: number;
    anchorCount: number;
    requestedLimit: number;
  };
}

export interface GridCell {
  row: number;
  col: number;
  bounds: MapBounds;
}

export function splitBoundsIntoGrid(
  bounds: MapBounds,
  rows: number,
  cols: number,
): GridCell[] {
  const latStep = (bounds.north - bounds.south) / rows;
  const lngStep = (bounds.east - bounds.west) / cols;
  const cells: GridCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        row,
        col,
        bounds: {
          south: bounds.south + row * latStep,
          north: bounds.south + (row + 1) * latStep,
          west: bounds.west + col * lngStep,
          east: bounds.west + (col + 1) * lngStep,
        },
      });
    }
  }
  return cells;
}
