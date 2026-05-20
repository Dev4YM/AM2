import Link from "next/link";
import { cn } from "@/lib/utils";
import { sidebarMenuButtonVariants } from "@/components/ui/sidebar";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

type SidebarLinkProps = ComponentProps<typeof Link> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    isActive?: boolean;
  };

/** Sidebar nav link — avoids Base UI `render` + `nativeButton` warnings. */
export function SidebarLink({
  href,
  children,
  isActive,
  variant = "default",
  size = "default",
  className,
  ...props
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-active={isActive ? "" : undefined}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}
