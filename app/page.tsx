import { Suspense } from "react";
import type { Metadata } from "next";
import Homepage from "./(home)/overview/page";
import Loader from "@/components/loader/loader";
import { APP_CONFIG } from "@/constant/app.config";

export const metadata: Metadata = {
  // Name only — this page-level title overrides the root layout's, and iOS
  // shows it in the share-sheet/install flow (see app/layout.tsx). The
  // tagline stays in openGraph.title below for shared-link previews.
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
    url: "/",
    // Must be repeated here: a page-level openGraph object REPLACES the root
    // layout's wholesale (no deep merge), so without this the homepage — the
    // link people actually share — had no og:image at all.
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
      },
    ],
  },
};

export default function Page() {
  return (
    <div className="h-full w-full">
      <Suspense fallback={<Loader />}>
        <Homepage />
      </Suspense>
    </div>
  );
}
