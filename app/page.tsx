import { Suspense } from "react";
import type { Metadata } from "next";
import Homepage from "./(home)/overview/page";
import Loader from "@/components/loader/loader";
import { APP_CONFIG } from "@/constant/app.config";
import { toLocale } from "@/i18n/config";

// Link-preview crawlers (WhatsApp, Telegram, Facebook, ...) fetch this URL
// anonymously and cache the resulting preview per exact URL — they never see
// the visitor's `locale` cookie, so the *only* way a shared link's preview can
// show Kinyarwanda copy is if the language is encoded in the URL itself. A
// share action that wants an rw preview should link to "/?lang=rw"; anything
// else (including a bare share of "/") falls back to English.
const OG_CONTENT = {
  en: {
    tagline: APP_CONFIG.tagline,
    description: APP_CONFIG.description,
    image: "/og-image.png",
  },
  rw: {
    tagline: "Hura n'Abatanga Serivisi Zizewe",
    description:
      "Isoko ry'imirimo yo mu rugo mu Rwanda rihuza imiryango n'abakozi ba serivisi bemejwe.",
    image: "/og-image-rw.png",
  },
} as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const locale = toLocale(lang);
  const { tagline, description, image } = OG_CONTENT[locale];

  return {
    // Name only — this page-level title overrides the root layout's, and iOS
    // shows it in the share-sheet/install flow (see app/layout.tsx). The
    // tagline stays in openGraph.title below for shared-link previews.
    title: APP_CONFIG.name,
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: `${APP_CONFIG.name} - ${tagline}`,
      description,
      url: lang ? `/?lang=${locale}` : "/",
      // Must be repeated here: a page-level openGraph object REPLACES the root
      // layout's wholesale (no deep merge), so without this the homepage — the
      // link people actually share — had no og:image at all.
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${APP_CONFIG.name} - ${tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${APP_CONFIG.name} - ${tagline}`,
      description,
      images: [image],
    },
  };
}

export default function Page() {
  return (
    <div className="h-full w-full">
      <Suspense fallback={<Loader />}>
        <Homepage />
      </Suspense>
    </div>
  );
}
