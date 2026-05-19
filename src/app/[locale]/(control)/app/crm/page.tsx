import { setRequestLocale } from "next-intl/server";
import { CrmDashboard } from "@/components/crm/crm-dashboard";

export default async function CrmPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CrmDashboard />;
}
