import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Globe,
  Handshake,
  LifeBuoy,
  ListChecks,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Marketing copy lives here, one object per locale, so the same presentational
// component (marketing-home.tsx) can render a fully-translated English page at
// /welcome and a fully-translated Kinyarwanda page at /rw. We intentionally do
// NOT route this through next-intl / messages/*.json: the app's i18n has no URL
// routing (locale is a cookie), which means a cookie-less Googlebot can never
// crawl the Kinyarwanda version. Two real URLs + hreflang is what makes the
// Kinyarwanda page indexable on its own.
//
// ⚠️  The `rw` copy below is a first draft and MUST be reviewed by a native
// Kinyarwanda speaker before it is considered final (see i18n translation
// policy). Fix in place — do not regenerate.
// ---------------------------------------------------------------------------

export type MarketingLocale = "en" | "rw";

// The marketing site's own origin. `metadataBase` in the root layout resolves
// to the APP domain (app.huza.app) on Vercel, so page-relative canonical /
// hreflang / og:url values on the marketing pages would wrongly point at the
// app domain. We build absolute marketing URLs from this instead.
export const MARKETING_ORIGIN =
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://www.huza.app";

export const marketingUrl = (path: string) => `${MARKETING_ORIGIN}${path}`;

export interface MarketingDict {
  /** <html lang> + hreflang code for this page. */
  locale: MarketingLocale;
  /** Path of this page (used for canonical + as the hreflang target). */
  path: string;
  meta: { title: string; description: string };
  nav: {
    links: { href: string; label: string }[];
    openApp: string;
    /** Label of the *other* language, shown on the toggle. */
    otherLangLabel: string;
    otherLangHref: string;
  };
  hero: {
    badge: string;
    /** Rendered with `{trusted}` and `{job}` wrapped in the brand colour. */
    titleLead: string;
    titleTrusted: string;
    titleMid: string;
    titleJob: string;
    body: string;
    openApp: string;
    howItWorks: string;
    imageAlt: string;
    appImageAlt: string;
    chips: { Icon: LucideIcon; label: string }[];
  };
  how: {
    heading: string;
    sub: string;
    steps: { Icon: LucideIcon; title: string; body: string }[];
  };
  workers: {
    id: "workers";
    imageAlt: string;
    heading: string;
    tagline: string;
    points: string[];
    cta: string;
  };
  employers: {
    id: "employers";
    imageAlt: string;
    heading: string;
    tagline: string;
    points: string[];
    cta: string;
  };
  trust: {
    heading: string;
    sub: string;
    tiles: { Icon: LucideIcon; title: string; body: string }[];
    freeNote: string;
  };
  cta: { heading: string; body: string; button: string };
  footer: {
    tagline: string;
    columns: { title: string; links: { label: string; href: string }[] }[];
    rights: string;
  };
}

// Anchor hrefs are shared between locales — the section ids never change.
const A = { how: "#how", workers: "#workers", employers: "#employers", trust: "#trust" };

export const marketingEn: MarketingDict = {
  locale: "en",
  path: "/welcome",
  meta: {
    title: "Huza — Rwanda's trusted marketplace for household & service work",
    description:
      "Huza connects households in Rwanda with verified cleaners, nannies, cooks and skilled workers — and helps workers find reliable jobs. Free to join.",
  },
  nav: {
    links: [
      { href: A.how, label: "How it works" },
      { href: A.workers, label: "For workers" },
      { href: A.employers, label: "For employers" },
      { href: A.trust, label: "Trust & safety" },
    ],
    openApp: "Open the app",
    otherLangLabel: "Ikinyarwanda",
    otherLangHref: "/rw",
  },
  hero: {
    badge: "Rwanda's trusted marketplace for household & service work",
    titleLead: "Find ",
    titleTrusted: "trusted",
    titleMid: " help,\nor your next ",
    titleJob: "job",
    body: "Huza connects households with verified service workers across Rwanda — and helps skilled people find reliable work they can trust. Free to join.",
    openApp: "Open the app",
    howItWorks: "How it works",
    imageAlt: "A verified Huza worker cleaning a home in Kigali",
    appImageAlt: "The Huza app home screen — tap to open the app",
    chips: [
      { Icon: ShieldCheck, label: "Verified" },
      { Icon: Star, label: "Reviewed" },
      { Icon: Globe, label: "Kinyarwanda & English" },
      { Icon: Sparkles, label: "Free to join" },
    ],
  },
  how: {
    heading: "How it works",
    sub: "Simple steps to get things done.",
    steps: [
      { Icon: Search, title: "Discover", body: "Browse trusted workers or job opportunities that match your needs." },
      { Icon: ListChecks, title: "Compare", body: "View profiles, ratings and details to choose what works best." },
      { Icon: Handshake, title: "Connect", body: "Chat, agree and get the job done with confidence." },
    ],
  },
  workers: {
    id: "workers",
    imageAlt: "A job opportunity on Huza — find work that fits",
    heading: "For workers",
    tagline: "Find jobs. Grow your income.",
    points: [
      "Find verified job opportunities near you",
      "Build a profile and get noticed",
      "Get paid fairly and on time",
      "Grow your skills and reputation",
    ],
    cta: "Start finding work",
  },
  employers: {
    id: "employers",
    imageAlt: "A verified worker profile on Huza — hire with confidence",
    heading: "For employers",
    tagline: "Hire with confidence.",
    points: [
      "Post a job in minutes",
      "Hire from verified workers",
      "Safe, in-app communication",
      "Reliable help, when you need it",
    ],
    cta: "Find trusted help",
  },
  trust: {
    heading: "Built on trust & safety",
    sub: "Trust is the product. Every part of Huza is designed so both sides feel safe.",
    tiles: [
      { Icon: BadgeCheck, title: "Verified workers", body: "ID and background checks before anyone can offer a service." },
      { Icon: Star, title: "Real reviews", body: "Honest ratings from real clients — reputation you can see." },
      { Icon: LifeBuoy, title: "Report & support", body: "A clear way to raise an issue and get help when you need it." },
      { Icon: Lock, title: "Safety first", body: "Private messaging and details you control, never overshared." },
    ],
    freeNote: "Huza is free to join — browse verified workers and post jobs at no cost.",
  },
  cta: {
    heading: "Ready to get started?",
    body: "Open Huza and join households and workers building trust and opportunity.",
    button: "Open Huza",
  },
  footer: {
    tagline: "Building trust. Creating opportunities across Rwanda.",
    columns: [
      {
        title: "For workers",
        links: [
          { label: "Find jobs", href: "APP" },
          { label: "How it works", href: A.how },
          { label: "Trust & safety", href: A.trust },
        ],
      },
      {
        title: "For employers",
        links: [
          { label: "Hire help", href: "APP" },
          { label: "Post a job", href: "APP" },
          { label: "How it works", href: A.how },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "Trust & safety", href: A.trust },
          { label: "Privacy policy", href: "/privacy" },
          { label: "Terms of service", href: "/terms" },
        ],
      },
    ],
    rights: "All rights reserved.",
  },
};

export const marketingRw: MarketingDict = {
  locale: "rw",
  path: "/rw",
  meta: {
    title: "Huza — isoko ryizewe ry'akazi ko mu rugo n'izindi serivisi mu Rwanda",
    description:
      "Huza ihuza ingo zo mu Rwanda n'abakozi bagenzuwe: abadecheza, abarezi b'abana, abateka n'abandi bafite ubumenyi — kandi igafasha abakozi kubona akazi keezewe. Kwiyandikisha ni ubuntu.",
  },
  nav: {
    links: [
      { href: A.how, label: "Uko bikora" },
      { href: A.workers, label: "Ku bakozi" },
      { href: A.employers, label: "Ku bakoresha" },
      { href: A.trust, label: "Kwizerana n'umutekano" },
    ],
    openApp: "Fungura porogaramu",
    otherLangLabel: "English",
    otherLangHref: "/welcome",
  },
  hero: {
    badge: "Isoko ryizewe ry'akazi ko mu rugo n'izindi serivisi mu Rwanda",
    titleLead: "Shaka ubufasha ",
    titleTrusted: "bwizewe",
    titleMid: ",\ncyangwa akazi kawe ",
    titleJob: "gakurikira",
    body: "Huza ihuza ingo n'abakozi ba serivisi bagenzuwe mu Rwanda hose — kandi igafasha abafite ubumenyi kubona akazi keezewe bakizera. Kwiyandikisha ni ubuntu.",
    openApp: "Fungura porogaramu",
    howItWorks: "Uko bikora",
    imageAlt: "Umukozi wa Huza wagenzuwe asukura urugo i Kigali",
    appImageAlt: " Urupapuro rw'itangiriro rwa porogaramu ya Huza — kanda ufungure porogaramu",
    chips: [
      { Icon: ShieldCheck, label: "Byagenzuwe" },
      { Icon: Star, label: "Byasuzumwe" },
      { Icon: Globe, label: "Ikinyarwanda n'Icyongereza" },
      { Icon: Sparkles, label: "Ku buntu" },
    ],
  },
  how: {
    heading: "Uko bikora",
    sub: "Intambwe zoroshye zo gukora ibyo ukeneye.",
    steps: [
      { Icon: Search, title: "Shakisha", body: "Reba abakozi bizewe cyangwa amahirwe y'akazi bihuye n'ibyo ukeneye." },
      { Icon: ListChecks, title: "Gereranya", body: "Reba imyirondoro, amanota n'amakuru maze uhitemo ikinoze." },
      { Icon: Handshake, title: "Vugana", body: "Muvugane, mwumvikane, akazi karangire wizeye." },
    ],
  },
  workers: {
    id: "workers",
    imageAlt: "Amahirwe y'akazi kuri Huza — shaka akazi kagufitiye akamaro",
    heading: "Ku bakozi",
    tagline: "Shaka akazi. Ongera amafaranga winjiza.",
    points: [
      "Shaka amahirwe y'akazi agenzuwe hafi yawe",
      "Kora umwirondoro maze umenyekane",
      "Hembwe uko bikwiye kandi ku gihe",
      "Teza imbere ubumenyi n'izina ryawe",
    ],
    cta: "Tangira gushaka akazi",
  },
  employers: {
    id: "employers",
    imageAlt: "Umwirondoro w'umukozi wagenzuwe kuri Huza — koresha wizeye",
    heading: "Ku bakoresha",
    tagline: "Koresha wizeye.",
    points: [
      "Tanga akazi mu minota mike",
      "Koresha abakozi bagenzuwe",
      "Kuvugana mu buryo bwizewe muri porogaramu",
      "Ubufasha bwizewe igihe ubukeneye",
    ],
    cta: "Shaka ubufasha bwizewe",
  },
  trust: {
    heading: "Twubakiye ku kwizerana n'umutekano",
    sub: "Kwizerana ni yo ntego. Buri gice cya Huza cyubatswe kugira ngo impande zombi zumve zifite umutekano.",
    tiles: [
      { Icon: BadgeCheck, title: "Abakozi bagenzuwe", body: "Kugenzura indangamuntu n'amateka mbere y'uko umuntu atanga serivisi." },
      { Icon: Star, title: "Ibitekerezo nyakuri", body: "Amanota y'ukuri ava ku bakiriya nyakuri — izina rigaragara." },
      { Icon: LifeBuoy, title: "Gutanga ikibazo no gufashwa", body: "Uburyo bworoshye bwo kugaragaza ikibazo no kubona ubufasha." },
      { Icon: Lock, title: "Umutekano mbere ya byose", body: "Ubutumwa bwihariye n'amakuru ugenzura, ntabwo asangizwa." },
    ],
    freeNote: "Huza ni ubuntu kwiyandikisha — reba abakozi bagenzuwe kandi utange akazi ku buntu.",
  },
  cta: {
    heading: "Witeguye gutangira?",
    body: "Fungura Huza wifatanye n'ingo n'abakozi bubaka kwizerana n'amahirwe.",
    button: "Fungura Huza",
  },
  footer: {
    tagline: "Twubaka kwizerana. Duhanga amahirwe mu Rwanda hose.",
    columns: [
      {
        title: "Ku bakozi",
        links: [
          { label: "Shaka akazi", href: "APP" },
          { label: "Uko bikora", href: A.how },
          { label: "Kwizerana n'umutekano", href: A.trust },
        ],
      },
      {
        title: "Ku bakoresha",
        links: [
          { label: "Shaka ubufasha", href: "APP" },
          { label: "Tanga akazi", href: "APP" },
          { label: "Uko bikora", href: A.how },
        ],
      },
      {
        title: "Ikigo",
        links: [
          { label: "Kwizerana n'umutekano", href: A.trust },
          { label: "Politiki y'ibanga", href: "/privacy" },
          { label: "Amabwiriza y'imikoreshereze", href: "/terms" },
        ],
      },
    ],
    rights: "Uburenganzira bwose burabitswe.",
  },
};

export const CHECK_ICON = CheckCircle2;
export const ARROW_ICON = ArrowRight;

export function marketingDict(locale: MarketingLocale): MarketingDict {
  return locale === "rw" ? marketingRw : marketingEn;
}
