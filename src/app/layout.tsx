import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_DISPLAY, APP_SHORT, APP_TAGLINE, APP_VERSION } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
