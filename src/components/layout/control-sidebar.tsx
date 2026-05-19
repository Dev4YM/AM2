"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Bot,
  Calendar,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Route,
  Search,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarLink } from "@/components/ui/sidebar-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BetaBadge } from "@/components/ui/beta-badge";
import { APP_NAME, APP_SHORT } from "@/lib/brand";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/finder", label: "Business Finder", icon: Search },
  { href: "/app/crm", label: "Mapped CRM", icon: Map },
  { href: "/app/territories", label: "Territories", icon: MapPinned },
  { href: "/app/routes", label: "Smart Routes", icon: Route },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/assistant", label: "AI Assistant", icon: Bot },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function ControlSidebar({ prefix }: { prefix: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    const full = `${prefix}${href}`.replace(/\/$/, "") || "/";
    const current = pathname?.replace(/\/$/, "") || "/";
    return current === full || current.startsWith(`${full}/`);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarLink href={`${prefix}/app/dashboard`} size="lg" className="h-12">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-bold text-sm">
                A2
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">{APP_SHORT}</span>
                <span className="text-muted-foreground text-xs">{APP_NAME}</span>
              </div>
            </SidebarLink>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pb-1">
          <BetaBadge className="w-full justify-center" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarLink
                    href={`${prefix}${href}`}
                    isActive={isActive(href)}
                    title={label}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {session?.user && (
          <div className="flex flex-col gap-2 p-2">
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback>
                  {session.user.name?.slice(0, 2).toUpperCase() ?? "AM"}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{session.user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {session.user.email}
                </span>
              </div>
            </div>
            <Separator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: prefix || "/" })}
            >
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
