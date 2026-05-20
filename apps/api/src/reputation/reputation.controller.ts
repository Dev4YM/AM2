import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsNumber, IsObject, IsOptional } from "class-validator";
import { CollectorMetricsService } from "./collector-metrics.service";
import { LearningCenterService } from "./learning-center.service";
import { ReputationService } from "./reputation.service";

class ScoreDto {
  @IsOptional()
  @IsObject()
  signals?: Record<string, number>;
}

class FeedbackDto {
  @Type(() => Number)
  @IsNumber()
  delta!: number;
}

@Controller("reputation")
export class ReputationController {
  constructor(
    private readonly reputation: ReputationService,
    private readonly collectorMetrics: CollectorMetricsService,
    private readonly learningCenter: LearningCenterService,
  ) {}

  @Get("scores")
  getCollectorScores() {
    return { collectors: this.collectorMetrics.getScores() };
  }

  @Get("learning-center")
  getLearningCenter() {
    return this.learningCenter.getEnrichmentInsights();
  }

  @Post(":entityId/score")
  score(@Param("entityId") entityId: string, @Body() body: ScoreDto) {
    return this.reputation.scoreEntity(entityId, body.signals);
  }

  @Post(":entityId/feedback")
  feedback(@Param("entityId") entityId: string, @Body() body: FeedbackDto) {
    return this.reputation.recordFeedback(entityId, body.delta);
  }
}
