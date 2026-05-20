/** Qualified / enriched lead data produced by enrichment pipeline. */

export interface QualifiedLeadData {
  leadId: string;
  enriched: boolean;
  firmographics?: {
    employeeRange?: string;
    revenueRange?: string;
    industry?: string;
  };
  contactQuality?: "high" | "medium" | "low";
  signals?: string[];
  enrichedAt?: string;
}

export interface EnrichmentJobRequest {
  leadId: string;
  force?: boolean;
}

export interface EnrichmentJobResult {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  qualified?: QualifiedLeadData;
}
