import { Injectable } from "@nestjs/common";

export interface ReputationScore {
  entityId: string;
  score: number;
  factors: { label: string; weight: number; value: number }[];
  learnedAt: string;
}

@Injectable()
export class ReputationService {
  /** Stub: learning & reputation scoring — connect to feedback store later. */
  scoreEntity(entityId: string, signals?: Record<string, number>): ReputationScore {
    const rating = signals?.rating ?? 0;
    const reviewCount = signals?.reviewCount ?? 0;
    const engagement = signals?.engagement ?? 0;

    const normalizedRating = Math.min(5, Math.max(0, rating)) / 5;
    const volumeBoost = Math.min(1, reviewCount / 50);
    const engagementBoost = Math.min(1, engagement);

    const score = Number(
      (normalizedRating * 0.5 + volumeBoost * 0.3 + engagementBoost * 0.2).toFixed(
        3,
      ),
    );

    return {
      entityId,
      score,
      factors: [
        { label: "rating", weight: 0.5, value: normalizedRating },
        { label: "review_volume", weight: 0.3, value: volumeBoost },
        { label: "engagement", weight: 0.2, value: engagementBoost },
      ],
      learnedAt: new Date().toISOString(),
    };
  }

  recordFeedback(_entityId: string, _delta: number) {
    return { accepted: true, message: "Feedback recording stub — persist in DB later." };
  }
}
