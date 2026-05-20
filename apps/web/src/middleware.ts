import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing only. Auth is enforced in API routes (requireSession) and
 * the control-plane shell (AppShell) — not via middleware redirects, because
 * /app/dashboard is both the sign-in surface and the main entry point.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
