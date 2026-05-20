import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";
import { SearchQueryDto } from "./dto/search-query.dto";

@Controller("search")
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  searchBusinesses(@Query() query: SearchQueryDto) {
    return this.search.execute(query);
  }
}
