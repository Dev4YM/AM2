import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Database, Map, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BetaBadge } from "@/components/ui/beta-badge";
import { APP_DISPLAY, APP_SHORT } from "@/lib/brand";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const prefix = locale === "en" ? "" : `/${locale}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <BetaBadge />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{APP_DISPLAY}</h1>
        </div>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          {APP_SHORT} — open-source B2B lead finder and mapped CRM with AI sales tools.
          Self-host on your machine — full control plane included, no subscriptions.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink size="lg" href={`${prefix}/app/dashboard`}>
            Launch control plane
            <ArrowRight data-icon="inline-end" />
          </ButtonLink>
          <ButtonLink size="lg" variant="outline" href={`${prefix}/app/finder`}>
            Business Finder
          </ButtonLink>
        </div>
      </div>

      <Alert>
        <Database />
        <AlertTitle>Local data only</AlertTitle>
        <AlertDescription>
          {APP_SHORT} does not ship a live multi-tenant business database or real-time sync between
          users. Search uses a bundled sample catalog; your CRM data lives in SQLite on this
          server.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <Map className="text-muted-foreground mb-2 size-8" />
            <CardTitle className="text-base">Mapped CRM</CardTitle>
            <CardDescription>GPS leads, status pipeline, territories</CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonLink variant="link" className="h-auto p-0" href={`${prefix}/app/crm`}>
              Open CRM
            </ButtonLink>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Sparkles className="text-muted-foreground mb-2 size-8" />
            <CardTitle className="text-base">AI tools</CardTitle>
            <CardDescription>Smart reviews, emails, assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonLink variant="link" className="h-auto p-0" href={`${prefix}/app/assistant`}>
              Open assistant
            </ButtonLink>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Database className="text-muted-foreground mb-2 size-8" />
            <CardTitle className="text-base">Self-hosted</CardTitle>
            <CardDescription>MIT licensed · fork and extend</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No pricing tiers. No paywalls.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
