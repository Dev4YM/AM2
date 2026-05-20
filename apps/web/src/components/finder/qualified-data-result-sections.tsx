"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type {
  QualifiedBusinessProfile,
  QualifiedTierKey,
  SmartEmailDraft,
} from "@/lib/qualified-data-api";
import { QUALIFIED_DATA_TIERS } from "@/components/finder/qualified-data-panel";

interface QualifiedDataResultSectionsProps {
  profile: QualifiedBusinessProfile | null;
  loadingTiers: Set<QualifiedTierKey>;
  error?: string | null;
}

function TierBlock({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border/60 rounded-md border">
      <button
        type="button"
        className="hover:bg-muted/50 flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <span className="text-[10px] font-medium">{title}</span>
        <ChevronDown
          className={`text-muted-foreground size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-border/60 space-y-1 border-t px-2 py-1.5">{children}</div>
      ) : null}
    </div>
  );
}

export function QualifiedDataResultSections({
  profile,
  loadingTiers,
  error,
}: QualifiedDataResultSectionsProps) {
  const [openSections, setOpenSections] = useState<Set<QualifiedTierKey>>(new Set(["business"]));

  if (error) {
    return <p className="text-destructive text-[10px] leading-snug">{error}</p>;
  }

  if (!profile && loadingTiers.size === 0) return null;

  const toggle = (key: QualifiedTierKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
      {QUALIFIED_DATA_TIERS.map((tier) => {
        const isLoading = loadingTiers.has(tier.key);
        const isOpen = openSections.has(tier.key);
        const hasData = profile?.tiersCompleted?.includes(tier.key);

        if (!isLoading && !hasData) return null;

        return (
          <TierBlock
            key={tier.key}
            title={tier.title}
            open={isOpen}
            onToggle={() => toggle(tier.key)}
          >
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ) : (
              <TierContent tierKey={tier.key} profile={profile} />
            )}
          </TierBlock>
        );
      })}
      {loadingTiers.size > 0 && !profile && (
        <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
          <Loader2 className="size-3 animate-spin" />
          Enriching…
        </p>
      )}
    </div>
  );
}

function TierContent({
  tierKey,
  profile,
}: {
  tierKey: QualifiedTierKey;
  profile: QualifiedBusinessProfile | null;
}) {
  if (!profile) return null;

  switch (tierKey) {
    case "business": {
      const d = profile.businessData;
      if (!d) return <p className="text-muted-foreground text-[10px]">No business data.</p>;
      return (
        <ul className="text-muted-foreground space-y-0.5 text-[10px]">
          {d.landline && <li>Phone: {d.landline}</li>}
          {d.website && <li>Web: {d.website}</li>}
          {d.hours && <li>Hours: {d.hours}</li>}
          {d.rating != null && (
            <li>
              Rating: {d.rating} ({d.reviewCount ?? 0} reviews)
            </li>
          )}
        </ul>
      );
    }
    case "enriched": {
      const d = profile.enrichedData;
      if (!d) return <p className="text-muted-foreground text-[10px]">No enriched data.</p>;
      return (
        <ul className="text-muted-foreground space-y-0.5 text-[10px]">
          {d.emails?.length ? <li>Emails: {d.emails.join(", ")}</li> : null}
          {d.mobilePhones?.length ? <li>Mobile: {d.mobilePhones.join(", ")}</li> : null}
          {d.whatsapp && <li>WhatsApp: {d.whatsapp}</li>}
          <li>
            <Badge variant="outline" className="h-4 text-[9px]">
              {d.enrichmentStatus}
            </Badge>
          </li>
        </ul>
      );
    }
    case "reviews": {
      const d = profile.smartReviews;
      if (!d) return <p className="text-muted-foreground text-[10px]">No review analysis.</p>;
      return (
        <div className="text-muted-foreground space-y-0.5 text-[10px]">
          <p>{d.summary}</p>
          {d.themes.length > 0 && <p>Themes: {d.themes.join(" · ")}</p>}
        </div>
      );
    }
    case "sales": {
      const d = profile.smartSales;
      if (!d) return <p className="text-muted-foreground text-[10px]">No sales insights.</p>;
      return (
        <div className="text-muted-foreground space-y-0.5 text-[10px]">
          <p>{d.prospectingAngle}</p>
          {d.opportunities.length > 0 && <p>Opportunities: {d.opportunities.join(" · ")}</p>}
        </div>
      );
    }
    case "emails": {
      const d = profile.smartEmails;
      if (!d?.drafts.length) return <p className="text-muted-foreground text-[10px]">No drafts.</p>;
      return (
        <ul className="space-y-1">
          {d.drafts.map((draft: SmartEmailDraft, i: number) => (
            <li key={i} className="rounded border px-1.5 py-1 text-[10px]">
              <p className="font-medium">{draft.subject}</p>
              <p className="text-muted-foreground line-clamp-3">{draft.body}</p>
            </li>
          ))}
        </ul>
      );
    }
    default:
      return null;
  }
}
