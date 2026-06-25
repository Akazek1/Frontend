import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.contact.website),
  title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
  description: APP_CONFIG.description,
  manifest: "/manifest.webmanifest",
  applicationName: APP_CONFIG.name,
  openGraph: {
    type: "website",
    siteName: APP_CONFIG.name,
    title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
    url: APP_CONFIG.contact.website,
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: APP_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    title: APP_CONFIG.name,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: APP_CONFIG.brand.primaryColor,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Locale comes from the cookie via i18n/request.ts (no URL routing).
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${urbanist.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider>
        <Providers>
          <QueryProvider>
            <ViewModeProvider>
              <BookmarkProvider>
                <AuthGateProvider>
                  <Layout>
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
