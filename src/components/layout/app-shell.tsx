"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ControlSidebar } from "@/components/layout/control-sidebar";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { APP_DISPLAY } from "@/lib/brand";

export function AppShell({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading workspace…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
        <Alert className="max-w-lg">
          <Info />
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>
            {APP_DISPLAY} is free and self-hosted. Create an account to use the control plane.
            Data is stored locally on this server — not a live shared cloud database.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setAuthOpen(true)}>Sign in or register</Button>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <ControlSidebar prefix={prefix} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-muted-foreground text-sm">
            Open source · local SQLite · no real-time sync
          </span>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </SidebarInset>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </SidebarProvider>
  );
}
