import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  EnrichQualifiedDataRequest,
  QualifiedBusinessProfile,
} from "@am2/shared";
import { QualifiedDataService } from "./qualified-data.service";

export type EnrichmentJobStatus = "queued" | "running" | "completed" | "failed";

export interface EnrichmentJob {
  id: string;
  status: EnrichmentJobStatus;
  createdAt: string;
  updatedAt: string;
  request: EnrichQualifiedDataRequest;
  result?: QualifiedBusinessProfile;
  error?: string;
}

@Injectable()
export class EnrichmentQueueService {
  private readonly logger = new Logger(EnrichmentQueueService.name);
  private readonly jobs = new Map<string, EnrichmentJob>();
  private active = 0;
  private readonly maxConcurrent = 3;

  constructor(private readonly qualifiedData: QualifiedDataService) {}

  enqueue(request: EnrichQualifiedDataRequest): EnrichmentJob {
    const id = randomUUID();
    const now = new Date().toISOString();
    const job: EnrichmentJob = {
      id,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      request,
    };
    this.jobs.set(id, job);
    void this.pump();
    return job;
  }

  get(id: string): EnrichmentJob | undefined {
    return this.jobs.get(id);
  }

  private async pump(): Promise<void> {
    if (this.active >= this.maxConcurrent) return;

    const next = [...this.jobs.values()].find((j) => j.status === "queued");
    if (!next) return;

    this.active++;
    next.status = "running";
    next.updatedAt = new Date().toISOString();

    try {
      next.result = await this.qualifiedData.enrich(next.request);
      next.status = "completed";
    } catch (e) {
      next.status = "failed";
      next.error = e instanceof Error ? e.message : "Enrichment failed";
      this.logger.warn(`Job ${next.id} failed: ${next.error}`);
    } finally {
      next.updatedAt = new Date().toISOString();
      this.active--;
      void this.pump();
    }
  }
}
