import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  async redirects() {
    return [
      { source: "/business-finder", destination: "/app/finder", permanent: true },
      { source: "/:locale/business-finder", destination: "/:locale/app/finder", permanent: true },
      { source: "/pricing", destination: "/app/dashboard", permanent: true },
      { source: "/:locale/pricing", destination: "/:locale/app/dashboard", permanent: true },
      { source: "/features", destination: "/app/dashboard", permanent: true },
      { source: "/:locale/features", destination: "/:locale/app/dashboard", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
