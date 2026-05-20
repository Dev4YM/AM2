import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { EnrichmentService } from "./enrichment.service";

class EnrichLeadDto {
  @IsString()
  leadId!: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

@Controller("enrichment")
export class EnrichmentController {
  constructor(private readonly enrichment: EnrichmentService) {}

  @Post()
  enqueue(@Body() body: EnrichLeadDto) {
    return this.enrichment.enqueue(body);
  }

  @Get("jobs/:jobId")
  status(@Param("jobId") jobId: string) {
    return this.enrichment.getStatus(jobId);
  }
}
