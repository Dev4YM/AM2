import { Module } from "@nestjs/common";
import { EmailsAiCollector } from "./collectors/emails-ai.collector";
import { EnrichmentCollector } from "./collectors/enrichment.collector";
import { GooglePlacesCollector } from "./collectors/google-places.collector";
import { HunterProvider } from "./collectors/hunter.provider";
import { ReviewsAiCollector } from "./collectors/reviews-ai.collector";
import { SalesAiCollector } from "./collectors/sales-ai.collector";
import { WebsiteScrapeProvider } from "./collectors/website-scrape.provider";
import { QualifiedDataCacheService } from "./cache/qualified-data-cache.service";
import { EnrichmentQueueService } from "./enrichment-queue.service";
import { QualifiedDataController } from "./qualified-data.controller";
import { QualifiedDataService } from "./qualified-data.service";

@Module({
  controllers: [QualifiedDataController],
  providers: [
    QualifiedDataCacheService,
    QualifiedDataService,
    EnrichmentQueueService,
    GooglePlacesCollector,
    EnrichmentCollector,
    WebsiteScrapeProvider,
    HunterProvider,
    ReviewsAiCollector,
    SalesAiCollector,
    EmailsAiCollector,
  ],
  exports: [QualifiedDataService],
})
export class QualifiedDataModule {}
