import { setRequestLocale } from "next-intl/server";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-slate sm:px-6">
      <h1>Terms of Service</h1>
      <p>Area To Monitor (AM2) is provided under the MIT License without warranty. By using software obtained from this repository you agree to comply with applicable laws regarding outreach, data protection, and business contact regulations in your jurisdiction.</p>
      <h2>Self-hosted responsibility</h2>
      <p>The operator of each deployment is responsible for user accounts, billing (if any), data accuracy, and compliance.</p>
    </div>
  );
}
