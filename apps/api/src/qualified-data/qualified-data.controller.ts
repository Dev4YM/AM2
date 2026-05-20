import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import type { QualifiedBusinessProfile } from "@am2/shared";
import { EnrichQualifiedDataDto } from "./dto/enrich-request.dto";
import { EnrichmentQueueService } from "./enrichment-queue.service";
import { QualifiedDataService } from "./qualified-data.service";

@Controller("qualified-data")
export class QualifiedDataController {
  constructor(
    private readonly qualifiedData: QualifiedDataService,
    private readonly queue: EnrichmentQueueService,
  ) {}

  @Post("enrich")
  async enrich(
    @Body() body: EnrichQualifiedDataDto,
  ): Promise<QualifiedBusinessProfile> {
    return this.qualifiedData.enrich({
      placeId: body.placeId,
      tiers: body.tiers,
      crmContext: body.crmContext,
      emailDraftCount: body.emailDraftCount,
    });
  }

  @Post("enrich/async")
  enqueue(@Body() body: EnrichQualifiedDataDto) {
    const job = this.queue.enqueue({
      placeId: body.placeId,
      tiers: body.tiers,
      crmContext: body.crmContext,
      emailDraftCount: body.emailDraftCount,
    });
    return { jobId: job.id, status: job.status };
  }

  @Get("jobs/:jobId")
  getJob(@Param("jobId") jobId: string) {
    const job = this.queue.get(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }

  @Get(":placeId")
  getCached(@Param("placeId") placeId: string): QualifiedBusinessProfile {
    return this.qualifiedData.getCached(
      decodeURIComponent(placeId).replace(/^places\//, ""),
    );
  }
}
