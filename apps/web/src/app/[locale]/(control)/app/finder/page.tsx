import { setRequestLocale } from "next-intl/server";
import { BusinessFinderApp } from "@/components/finder/business-finder-app";

export default async function FinderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BusinessFinderApp />;
}
