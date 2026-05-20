/** Server-side NestJS API base (no trailing slash). */
export function getAm2ApiBase(): string {
  return (
    process.env.AM2_API_URL ??
    process.env.NEXT_PUBLIC_AM2_API_URL ??
    "http://127.0.0.1:4000"
  ).replace(/\/$/, "");
}

/** Client-side — use Next.js BFF routes, not Nest directly. */
export function getAm2ApiBasePublic(): string {
  return "";
}

/** Server-side fetch to Nest with internal API key. */
export async function fetchAm2Api(
  path: string,
  init?: RequestInit & { userId?: string },
): Promise<Response> {
  const key = process.env.AM2_INTERNAL_API_KEY;
  if (!key) {
    throw new Error("AM2_INTERNAL_API_KEY is not set");
  }

  const headers = new Headers(init?.headers);
  headers.set("x-am2-internal-key", key);
  if (init?.userId) headers.set("x-user-id", init.userId);

  const url = `${getAm2ApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const { userId: _u, ...rest } = init ?? {};
  return fetch(url, { ...rest, headers, cache: "no-store" });
}
