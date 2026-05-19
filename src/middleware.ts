import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.includes("/app/")) {
    const locale = req.nextUrl.pathname.split("/")[1];
    const isLocale = routing.locales.includes(
      locale as (typeof routing.locales)[number],
    );
    const base = isLocale ? `/${locale}` : "";
    const signInUrl = new URL(`${base}/app/dashboard`, req.nextUrl.origin);
    return Response.redirect(signInUrl);
  }
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
