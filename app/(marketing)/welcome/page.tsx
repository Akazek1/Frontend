import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Globe,
  Handshake,
  LifeBuoy,
  ListChecks,
  Lock,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
} from "lucide-react";
import { APP_CONFIG } from "@/constant/app.config";
import { MarketingImage } from "@/components/marketing/marketing-image";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — ${APP_CONFIG.tagline}`,
  description: APP_CONFIG.description,
  alternates: { canonical: "/welcome" },
};

const CHIPS = [
  { Icon: ShieldCheck, label: "Verified" },
  { Icon: Star, label: "Reviewed" },
  { Icon: Globe, label: "Kinyarwanda & English" },
  { Icon: Smartphone, label: "Mobile-first" },
];

const STEPS = [
  { Icon: Search, title: "Discover", body: "Browse trusted workers or job opportunities that match your needs." },
  { Icon: ListChecks, title: "Compare", body: "View profiles, ratings and details to choose what works best." },
  { Icon: Handshake, title: "Connect", body: "Chat, agree and get the job done with confidence." },
];

const WORKER_POINTS = [
  "Find verified job opportunities near you",
  "Build a profile and get noticed",
  "Get paid fairly and on time",
  "Grow your skills and reputation",
];

const EMPLOYER_POINTS = [
  "Post a job in minutes",
  "Hire from verified workers",
  "Safe, in-app communication",
  "Reliable help, when you need it",
];

const TRUST = [
  { Icon: BadgeCheck, title: "Verified workers", body: "ID and background checks before anyone can offer a service." },
  { Icon: Star, title: "Real reviews", body: "Honest ratings from real clients — reputation you can see." },
  { Icon: LifeBuoy, title: "Report & support", body: "A clear way to raise an issue and get help when you need it." },
  { Icon: Lock, title: "Safety first", body: "Private messaging and details you control, never overshared." },
];

export default function MarketingHome() {
  return (
    <>
      {/* Hero */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-brand ring-1 ring-brand/15">
              Rwanda&apos;s trusted marketplace for household &amp; service help
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Find <span className="text-brand">trusted</span> help,
              <br />
              or your next <span className="text-brand">job</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">
              Huza connects households with verified service workers across Rwanda — and helps
              skilled people find reliable work they can trust.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Open the app <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center rounded-full border border-brand/30 px-7 py-3.5 text-base font-semibold text-brand transition-colors hover:bg-white"
              >
                How it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {CHIPS.map(({ Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-sm text-ink-muted">
                  <Icon className="h-4 w-4 text-brand" /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Real app screenshot inside a device frame. Drop the file at
              public/marketing/app-home.png and it appears automatically. */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-[280px] rounded-[2rem] bg-brand-dark p-2.5 shadow-2xl shadow-brand/20">
              <MarketingImage
                src="/marketing/app-home.webp"
                alt="The Huza app home screen"
                label="Add app screenshot"
                hint="Portrait phone screenshot (≈1080×2340)"
                className="aspect-[9/19] w-full overflow-hidden rounded-[1.6rem]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-ink">How it works</h2>
          <p className="mt-3 text-ink-muted">Simple steps to get things done.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ Icon, title, body }, i) => (
            <div key={title} className="rounded-2xl border border-black/5 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-brand">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 flex items-center gap-2 text-lg font-semibold text-ink">
                <span className="text-sm font-bold text-brand">{i + 1}</span> {title}
              </h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-20 sm:px-6 md:grid-cols-2">
          <div id="workers" className="scroll-mt-20 rounded-2xl bg-white p-8 ring-1 ring-brand/10">
            <MarketingImage
              src="/marketing/for-workers.png"
              alt="A job opportunity on Huza — find work that fits"
              label="Add the 'For workers' image"
              hint="Landscape — e.g. a job-posting card"
              className="mb-6 w-full overflow-hidden rounded-xl ring-1 ring-black/5"
            />
            <h2 className="text-2xl font-black text-ink">For workers</h2>
            <p className="mt-1 font-medium text-brand">Find jobs. Grow your income.</p>
            <ul className="mt-6 space-y-3">
              {WORKER_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-ink-muted">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" /> {p}
                </li>
              ))}
            </ul>
            <Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
              Start finding work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div id="employers" className="scroll-mt-20 rounded-2xl bg-white p-8 ring-1 ring-brand/10">
            <MarketingImage
              src="/marketing/for-employers.png"
              alt="A verified worker profile on Huza — hire with confidence"
              label="Add the 'For employers' image"
              hint="Landscape — e.g. a worker-profile card"
              className="mb-6 w-full overflow-hidden rounded-xl ring-1 ring-black/5"
            />
            <h2 className="text-2xl font-black text-ink">For employers</h2>
            <p className="mt-1 font-medium text-brand">Hire with confidence.</p>
            <ul className="mt-6 space-y-3">
              {EMPLOYER_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-ink-muted">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" /> {p}
                </li>
              ))}
            </ul>
            <Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
              Find trusted help <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & safety */}
      <section id="trust" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-ink">Built on trust &amp; safety</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            Trust is the product. Every part of Huza is designed so both sides feel safe.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-black/5 bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
        {/* Honest, forward-looking note — no invented user counts */}
        <p className="mt-10 text-center text-sm text-ink-subtle">
          Launching our Kigali pilot in 2026 — building trust and opportunity, one job at a time.
        </p>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-3xl bg-brand px-8 py-12 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-black text-white">Ready to get started?</h2>
            <p className="mt-2 text-white/85">Open Huza and join households and workers building trust and opportunity.</p>
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-brand transition-colors hover:bg-white/90"
          >
            Open Huza <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
