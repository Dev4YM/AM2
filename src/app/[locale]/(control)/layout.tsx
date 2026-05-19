import { AppShell } from "@/components/layout/app-shell";

export default function ControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
