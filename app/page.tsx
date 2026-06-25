import { Suspense } from "react";
import type { Metadata } from "next";
import Homepage from "./(home)/overview/page";
import Loader from "@/components/loader/loader";
import { APP_CONFIG } from "@/constant/app.config";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
  description: APP_CONFIG.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
    url: "/",
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
