import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { APP_DISPLAY, APP_SHORT, APP_TAGLINE, APP_VERSION } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_DISPLAY} — ${APP_VERSION}`,
    template: `%s | ${APP_SHORT}`,
  },
  description: `${APP_TAGLINE}. Local SQLite — no real-time shared database.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="min-h-svh font-sans antialiased">{children}</body>
    </html>
  );
}
