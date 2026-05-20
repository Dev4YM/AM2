import { Injectable } from "@nestjs/common";

export interface CollectorAttempt {
  collector: string;
  success: boolean;
  durationMs: number;
  error?: string;
  fieldsPopulated?: number;
}

export interface SourceReliabilityScore {
  collector: string;
  attempts: number;
  successes: number;
  successRate: number;
  avgDurationMs: number;
  reliabilityScore: number;
  lastAttemptAt?: string;
}

/** Tracks enrichment collector success rates for the learning center */
@Injectable()
export class CollectorMetricsService {
  private readonly attempts = new Map<string, CollectorAttempt[]>();

  record(attempt: CollectorAttempt): void {
    const list = this.attempts.get(attempt.collector) ?? [];
    list.push({ ...attempt });
    if (list.length > 500) list.splice(0, list.length - 500);
    this.attempts.set(attempt.collector, list);
  }

  getScores(): SourceReliabilityScore[] {
    const scores: SourceReliabilityScore[] = [];
    for (const [collector, list] of this.attempts) {
      if (list.length === 0) continue;
      const successes = list.filter((a) => a.success).length;
      const successRate = successes / list.length;
      const avgDurationMs =
        list.reduce((s, a) => s + a.durationMs, 0) / list.length;
      const reliabilityScore = Math.round(
        (successRate * 0.7 +
          Math.min(1, 2000 / Math.max(avgDurationMs, 1)) * 0.3) *
          100,
      );
      scores.push({
        collector,
        attempts: list.length,
        successes,
        successRate: Number(successRate.toFixed(3)),
        avgDurationMs: Math.round(avgDurationMs),
        reliabilityScore,
        lastAttemptAt: new Date().toISOString(),
      });
    }
    return scores.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }
}
