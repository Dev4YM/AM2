import { Injectable } from "@nestjs/common";
import type {
  EnrichmentJobRequest,
  EnrichmentJobResult,
  QualifiedLeadData,
} from "@am2/shared";

@Injectable()
export class EnrichmentService {
  /** Stub: queue enrichment job (wire to worker/queue later). */
  enqueue(request: EnrichmentJobRequest): EnrichmentJobResult {
    const qualified: QualifiedLeadData = {
      leadId: request.leadId,
      enriched: false,
      signals: ["enrichment_pipeline_not_configured"],
    };

    return {
      jobId: `enrich-${request.leadId}-${Date.now()}`,
      status: "queued",
      qualified,
    };
  }

  getStatus(jobId: string): EnrichmentJobResult {
    return {
      jobId,
      status: "completed",
      qualified: {
        leadId: jobId.replace(/^enrich-/, "").split("-")[0] ?? "unknown",
        enriched: false,
        contactQuality: "medium",
      },
    };
  }
}
