import type { Metadata } from "next";
import type { ReactNode } from "react";
import { APP_CONFIG } from "@/constant/app.config";

// The browse page itself (app/service/page.tsx) is a client component and can't
// export metadata. This server layout gives the route a real, category-specific
// title/description so it ranks for "home services app Rwanda" / "hire a cleaner
// Kigali" instead of inheriting the root layout's bare "Huza".
export const metadata: Metadata = {
  title: `Browse Verified Home Service Providers in Kigali & Rwanda | ${APP_CONFIG.seoName}`,
  description:
    "Browse and book vetted house cleaners, nannies, cooks, tutors, drivers and makeup artists near you in Kigali and across Rwanda on Huza App.",
  openGraph: {
    title: `Browse Verified Home Service Providers | ${APP_CONFIG.seoName}`,
    description:
      "Book vetted house cleaners, nannies, cooks, tutors, drivers and makeup artists near you in Rwanda.",
  },
};

export default function ServiceLayout({ children }: { children: ReactNode }) {
  return children;
}
