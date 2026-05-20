import { BadRequestException, Injectable } from "@nestjs/common";
import {
  DEFAULT_REACHING_CAP,
  isGeoSelectionComplete,
  type SearchResultPayload,
} from "@am2/shared";
import type { FinderBusiness, MapBounds } from "@am2/shared";
import { splitBoundsIntoGrid } from "@am2/shared";
import { GooglePlacesService } from "../places/google-places.service";
import type { SearchQueryDto } from "./dto/search-query.dto";

@Injectable()
export class SearchService {
  constructor(private readonly places: GooglePlacesService) {}

  parseBounds(dto: SearchQueryDto): MapBounds | undefined {
    const { north, south, east, west } = dto;
    if (
      north == null ||
      south == null ||
      east == null ||
      west == null ||
      [north, south, east, west].some((n) => Number.isNaN(n)) ||
      north <= south
    ) {
      return undefined;
    }
    return { north, south, east, west };
  }

  async execute(dto: SearchQueryDto): Promise<SearchResultPayload> {
    if (
      !isGeoSelectionComplete({
        countryCode: dto.country,
        regionId: dto.region,
        provinceId: dto.province,
      })
    ) {
      throw new BadRequestException(
        "Select a region and state/province before searching.",
      );
    }

    const bounds = this.parseBounds(dto);
    const limit = dto.limit ?? DEFAULT_REACHING_CAP;
    const googleEnabled = this.places.isConfigured();

    if (!googleEnabled) {
      return {
        results: [],
        source: "google",
        googleEnabled: false,
        message: "Add GOOGLE_MAPS_API_KEY for live Google Places search.",
      };
    }

    if (dto.mode === "reaching" && bounds) {
      return this.reachingGridSearch(dto, bounds, limit);
    }

    const { results, meta } = await this.places.search({
      query: dto.q,
      category: dto.category,
      countryCode: dto.country,
      regionId: dto.region,
      provinceId: dto.province,
      cityId: dto.city,
      city: dto.cityName,
      bounds,
      limit,
    });

    return {
      results,
      source: "google",
      googleEnabled: true,
      searchMode: bounds ? "area" : "text",
      meta,
    };
  }

  private async reachingGridSearch(
    dto: SearchQueryDto,
    bounds: MapBounds,
    limit: number,
  ): Promise<SearchResultPayload> {
    const rows = dto.gridRows ?? 2;
    const cols = dto.gridCols ?? 2;
    const page = dto.page ?? 0;
    const cells = splitBoundsIntoGrid(bounds, rows, cols);
    const totalPages = cells.length;

    if (page >= totalPages) {
      return {
        results: [],
        source: "google",
        googleEnabled: true,
        searchMode: "reaching",
        page,
        totalPages,
        message: "Page out of range",
      };
    }

    const cell = cells[page]!;
    const perCellLimit = Math.max(1, Math.ceil(limit / 2));
    const { results } = await this.places.search({
      query: dto.q,
      category: dto.category,
      countryCode: dto.country,
      regionId: dto.region,
      provinceId: dto.province,
      cityId: dto.city,
      city: dto.cityName,
      bounds: cell.bounds,
      limit: perCellLimit,
    });

    return {
      results: this.dedupe(results).slice(0, limit),
      source: "google",
      googleEnabled: true,
      searchMode: "reaching",
      page,
      totalPages,
      gridCell: { row: cell.row, col: cell.col },
    };
  }

  private dedupe(items: FinderBusiness[]): FinderBusiness[] {
    const seen = new Set<string>();
    return items.filter((b) => {
      const key = b.placeId ?? b.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
