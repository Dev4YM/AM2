import { Module } from "@nestjs/common";
import { EnrichmentController } from "./enrichment.controller";
import { EnrichmentService } from "./enrichment.service";

@Module({
  controllers: [EnrichmentController],
  providers: [EnrichmentService],
})
export class EnrichmentModule {}
