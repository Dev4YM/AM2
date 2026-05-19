import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";
import { BetaBadge } from "@/components/ui/beta-badge";
import { Separator } from "@/components/ui/separator";
import { APP_DISPLAY, APP_SHORT, GITHUB_REPO } from "@/lib/brand";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const prefix = locale === "en" ? "" : `/${locale}`;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <Link href={prefix || "/"} className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm">
            A2
          </span>
          {APP_SHORT}
        </Link>
        <div className="flex items-center gap-2">
          <BetaBadge />
          <ButtonLink variant="ghost" size="sm" href={`${prefix}/app/dashboard`}>
            Open app
          </ButtonLink>
          <ButtonLink size="sm" href={`${prefix}/app/dashboard`}>
            Control plane
          </ButtonLink>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-6 py-8">
        <p className="text-muted-foreground text-center text-sm">
          {APP_DISPLAY} — Beta · free & open source · local SQLite
        </p>
        <Separator className="my-4" />
        <nav className="text-muted-foreground flex flex-wrap justify-center gap-4 text-sm">
          <Link href={`${prefix}/privacy`}>Privacy</Link>
          <Link href={`${prefix}/terms`}>Terms</Link>
          <Link href={GITHUB_REPO} target="_blank" rel="noreferrer">
            GitHub
          </Link>
        </nav>
      </footer>
    </div>
  );
}
