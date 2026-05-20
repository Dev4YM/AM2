import { Global, Module } from "@nestjs/common";
import { CollectorMetricsService } from "./collector-metrics.service";
import { LearningCenterService } from "./learning-center.service";
import { ReputationController } from "./reputation.controller";
import { ReputationService } from "./reputation.service";

@Global()
@Module({
  controllers: [ReputationController],
  providers: [ReputationService, CollectorMetricsService, LearningCenterService],
  exports: [ReputationService, CollectorMetricsService, LearningCenterService],
})
export class ReputationModule {}
