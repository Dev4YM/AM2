import { Badge } from "@/components/ui/badge";
import { APP_VERSION } from "@/lib/brand";

export function BetaBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={className}>
      Beta · {APP_VERSION}
    </Badge>
  );
}
