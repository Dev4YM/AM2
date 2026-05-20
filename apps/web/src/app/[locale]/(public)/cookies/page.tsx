import { setRequestLocale } from "next-intl/server";

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-slate sm:px-6">
      <h1>Cookie Policy</h1>
      <p>Area To Monitor (AM2) uses essential session cookies for authentication when you sign in. Map tiles may set cookies from OpenStreetMap tile servers.</p>
      <p>Self-hosted operators may add analytics; disclose those cookies in your own policy.</p>
    </div>
  );
}
