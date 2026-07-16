import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import Layout from "@/components/layout/pwa-layout";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/store/provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { BookmarkProvider } from "@/context/bookmark-context"; // Ensure this import is correct
import { ViewModeProvider } from "@/context/view-mode-context";
import { AuthGateProvider } from "@/context/auth-gate-context";
import { AuthGateSheet } from "@/components/auth/auth-gate-sheet";
import { APP_CONFIG } from "@/constant/app.config";
import { PwaLifecycle } from "@/components/pwa/pwa-lifecycle";
import { isMarketingHost } from "@/lib/marketing-host";

// Load Geist fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-urbanist",
  display: "swap",
});

// Absolute-URL base for og:image and friends. APP_CONFIG.contact.website
// (akazek.rw) is NOT live — hardcoding it made every og:image point at a dead
// domain, which is why shared links never showed an image. Prefer an explicit
// override, then Vercel's production domain (becomes the custom domain
// automatically once one is attached), then the config value as last resort.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : APP_CONFIG.contact.website);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Just the app name: iOS shows the document title in the share-sheet /
  // Add-to-Home-Screen flow, and the tagline read as part of the app's name
  // there. The tagline still travels with shared links via og/twitter titles.
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  manifest: "/manifest.webmanifest",
  applicationName: APP_CONFIG.name,
  openGraph: {
    type: "website",
    siteName: APP_CONFIG.name,
    title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
    url: "/", // absolutized via metadataBase — not the dead APP_CONFIG domain
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: APP_CONFIG.name,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      // Theme-adaptive tab icon: an SVG with a prefers-color-scheme media
      // query inside (green mark on light themes, white on dark). This must
      // be the ONLY icon declared here: Chrome prefers raster entries (and
      // especially an ico with sizes="any") over the SVG, so listing the
      // 32/192/512 PNGs alongside it meant the SVG was never used. Legacy
      // fallback comes from the app/favicon.ico file convention (Next emits
      // that link automatically); the 192/512 PNGs live in the manifest.
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      // Exactly ONE apple-touch-icon: listing several makes iOS fetch each
      // candidate in turn (visible icon flicker in the share sheet) and lets
      // whichever loads last win — which is how a stale duplicate ends up as
      // the home-screen icon.
      // 1024x1024 (not 180x180): iOS upscaling an already-small pre-shrunk
      // icon produces a soft/glowy look on the home screen — the same
      // master size native App Store icons are provided at, so iOS can
      // downscale to whatever exact density it needs instead.
      { url: "/apple-icon.png", sizes: "1024x1024", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pin the scale so iOS Safari doesn't auto-zoom when an input is focused
  // (e.g. the search box) and then stay zoomed-in on the rest of the app.
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: APP_CONFIG.brand.primaryColor,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Locale comes from the cookie via i18n/request.ts (no URL routing).
  const locale = await getLocale();
  const host = (await headers()).get("host") || "";
  const onMarketingHost = isMarketingHost(host);
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${urbanist.variable}`}>
      <body className="antialiased">
        <NextIntlClientProvider>
        <Providers>
          <QueryProvider>
            <ViewModeProvider>
              <BookmarkProvider>
                <AuthGateProvider>
                  <Layout isMarketingHost={onMarketingHost}>
                    <Toaster position="top-center" />
                    <PwaLifecycle />
                    {children}
                  </Layout>
                  <AuthGateSheet />
                </AuthGateProvider>
              </BookmarkProvider>
            </ViewModeProvider>
          </QueryProvider>
        </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
