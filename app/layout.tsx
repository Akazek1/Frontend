import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
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
  title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${urbanist.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased">
        <Providers>
          <QueryProvider>
            <ViewModeProvider>
              <BookmarkProvider>
                <AuthGateProvider>
                  <Layout>
                    <Toaster position="top-center" />
                    {children}
                  </Layout>
                  <AuthGateSheet />
                </AuthGateProvider>
              </BookmarkProvider>
            </ViewModeProvider>
          </QueryProvider>
        </Providers>
      </body>
    </html>
  );
}