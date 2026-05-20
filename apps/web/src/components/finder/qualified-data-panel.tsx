"use client";

import { Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { QualifiedTierKey } from "@/lib/qualified-data-api";

export interface QualifiedDataTierOption {
  key: QualifiedTierKey;
  title: string;
  shortLabel: string;
  description: string;
}

export const QUALIFIED_DATA_TIERS: QualifiedDataTierOption[] = [
  {
    key: "business",
    title: "Business data",
    shortLabel: "Business",
    description: "Core listing: address, phone, hours, category, coordinates.",
  },
  {
    key: "enriched",
    title: "Enriched data",
    shortLabel: "Enriched",
    description: "Emails, mobile numbers, social profiles, WhatsApp.",
  },
  {
    key: "reviews",
    title: "Smart reviews",
    shortLabel: "Reviews",
    description: "AI summary of sentiment, themes, and pain points.",
  },
  {
    key: "sales",
    title: "Smart sales",
    shortLabel: "Sales",
    description: "Prospecting angles, weaknesses, and opportunities.",
  },
  {
    key: "emails",
    title: "Smart emails",
    shortLabel: "Emails",
    description: "Personalized outreach drafts for your CRM workflow.",
  },
];

interface QualifiedDataPanelProps {
  selectedTiers: Set<QualifiedTierKey>;
  onToggleTier: (tier: QualifiedTierKey) => void;
}

export function QualifiedDataPanel({ selectedTiers, onToggleTier }: QualifiedDataPanelProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Qualified data tiers">
      {QUALIFIED_DATA_TIERS.map((tier) => {
        const on = selectedTiers.has(tier.key);
        return (
          <button
            key={tier.key}
            type="button"
            title={tier.description}
            onClick={() => onToggleTier(tier.key)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
              on
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Checkbox
              checked={on}
              tabIndex={-1}
              className="size-3"
              onCheckedChange={() => onToggleTier(tier.key)}
              onClick={(e) => e.stopPropagation()}
            />
            {tier.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export function QualifiedDataPanelLegend() {
  return (
    <div className="text-muted-foreground flex items-center gap-1">
      <Sparkles className="text-primary size-3" />
      <Label className="text-[10px] font-medium tracking-wide">Qualified data</Label>
    </div>
  );
}
