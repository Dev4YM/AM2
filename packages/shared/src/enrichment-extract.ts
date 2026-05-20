/** Pure helpers to extract contact signals from HTML (no Node deps). */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const WHATSAPP_RE = /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)\/[^\s"'<>]+/gi;

const SOCIAL_PATTERNS: { platform: string; re: RegExp }[] = [
  { platform: "facebook", re: /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/gi },
  { platform: "instagram", re: /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/gi },
  { platform: "linkedin", re: /https?:\/\/(?:www\.)?linkedin\.com\/[^\s"'<>]+/gi },
  { platform: "twitter", re: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^\s"'<>]+/gi },
  { platform: "youtube", re: /https?:\/\/(?:www\.)?youtube\.com\/[^\s"'<>]+/gi },
  { platform: "tiktok", re: /https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'<>]+/gi },
];

export interface ScrapedContacts {
  emails: string[];
  mobilePhones: string[];
  socialLinks: { platform: string; url: string }[];
  whatsapp: string | null;
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function normalizeUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

export function extractContactsFromHtml(html: string, baseUrl: string): ScrapedContacts {
  const emails = unique(
    (html.match(EMAIL_RE) ?? []).filter(
      (e) => !e.endsWith(".png") && !e.endsWith(".jpg") && !e.includes("example.com"),
    ),
  ).slice(0, 10);

  const telMatches =
    html.match(/href=["']tel:([^"']+)["']/gi)?.map((m) => {
      const inner = m.match(/tel:([^"']+)/i)?.[1] ?? "";
      return decodeURIComponent(inner).replace(/\s+/g, "");
    }) ?? [];

  const mobilePhones = unique([
    ...telMatches,
    ...(html.match(PHONE_RE) ?? []).map((p) => p.replace(/\s+/g, "")),
  ]).slice(0, 8);

  const socialLinks: { platform: string; url: string }[] = [];
  for (const { platform, re } of SOCIAL_PATTERNS) {
    const matches = html.match(re) ?? [];
    for (const raw of matches.slice(0, 3)) {
      socialLinks.push({ platform, url: normalizeUrl(raw, baseUrl) });
    }
  }

  const waRaw = html.match(WHATSAPP_RE)?.[0] ?? null;
  const whatsapp = waRaw ? normalizeUrl(waRaw, baseUrl) : null;

  return {
    emails,
    mobilePhones,
    socialLinks: unique(socialLinks.map((s) => JSON.stringify(s))).map((s) =>
      JSON.parse(s),
    ),
    whatsapp,
  };
}

export function domainFromWebsite(website: string | null | undefined): string | null {
  if (!website) return null;
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
