import { Injectable } from "@nestjs/common";
import { CollectorMetricsService } from "./collector-metrics.service";

/** Stub learning center — aggregates enrichment outcomes for future tuning */
@Injectable()
export class LearningCenterService {
  constructor(private readonly metrics: CollectorMetricsService) {}

  getEnrichmentInsights() {
    const scores = this.metrics.getScores();
    return {
      status: "stub",
      message:
        "Learning center will tune collector priorities from historical success rates.",
      collectorScores: scores,
      recommendations: scores
        .filter((s) => s.successRate < 0.5)
        .map((s) => ({
          collector: s.collector,
          action: "review_configuration_or_fallback",
          successRate: s.successRate,
        })),
    };
  }
}
