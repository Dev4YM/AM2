import { setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-slate sm:px-6">
      <h1>Privacy Policy</h1>
      <p>Area To Monitor (AM2) is open source software you self-host. You control what data is stored, how long it is retained, and who can access it.</p>
      <h2>Data we process</h2>
      <p>When you run Area To Monitor (AM2) locally or on your infrastructure, the application stores account credentials, imported leads, notes, and optional AI prompts in your configured SQLite database.</p>
      <h2>Third-party services</h2>
      <p>Optional integrations (OpenAI, map tiles, calendar providers) are configured via environment variables. Review each provider&apos;s terms before enabling.</p>
      <h2>Contact</h2>
      <p>For privacy questions about a specific deployment, contact the operator of that instance.</p>
    </div>
  );
}
