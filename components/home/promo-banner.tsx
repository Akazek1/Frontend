"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

export interface HeroSlide {
  id: string;
  trustBadges: string[];
  headlineBefore: string;
  headlineHighlight: string;
  headlineAfter: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: string;
  bgColor: string;
}

interface ApiBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  ctaText: string | null;
  ctaLink: string | null;
  isActive: boolean;
  sortOrder: number;
}

const defaultSlides: HeroSlide[] = [
  {
    id: "default",
    trustBadges: ["Trusted", "Verified", "Reliable"],
    headlineBefore: "Find ",
    headlineHighlight: "trusted",
    headlineAfter: " help,\nget things done.",
    subtitle: "Verified professionals for your\nhome and daily needs.",
    primaryCta: { label: "Browse Services", href: "/service?category=all" },
    secondaryCta: { label: "How it works", href: "/onboarding" },
    image: "/images/Banner.png",
    bgColor: "#F0FAF0",
  },
];

function apiBannersToSlides(banners: ApiBanner[]): HeroSlide[] {
  const active = banners
    .filter((b) => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (!active.length) return defaultSlides;
  return active.map((b) => ({
    id: b.id,
    trustBadges: [],
    headlineBefore: "",
    headlineHighlight: b.title || "",
    headlineAfter: "",
    subtitle: b.subtitle || "",
    primaryCta: { label: b.ctaText || "Learn More", href: b.ctaLink || "/" },
    secondaryCta: { label: "Browse Services", href: "/service?category=all" },
    image: b.imageUrl,
    bgColor: "#F0FAF0",
  }));
}

function useDynamicBanners(): HeroSlide[] {
  const [slides, setSlides] = useState<HeroSlide[]>(defaultSlides);
  useEffect(() => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
    fetch(`${baseURL}/admin/banners`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!json) return;
        const banners: ApiBanner[] = json?.data ?? json;
        if (Array.isArray(banners) && banners.length) {
          setSlides(apiBannersToSlides(banners));
        }
      })
      .catch(() => {});
  }, []);
  return slides;
}

const AUTOPLAY_INTERVAL = 4000;

interface PromoBannerProps {
  slides?: HeroSlide[];
}

const PromoBanner: React.FC<PromoBannerProps> = ({ slides: propSlides }) => {
  const dynamicSlides = useDynamicBanners();
  const slides = propSlides ?? dynamicSlides;
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === activeIndex) return;
      setAnimating(true);
      setActiveIndex(index);
      setTimeout(() => setAnimating(false), 350);
    },
    [animating, activeIndex]
  );

  const next = useCallback(() => {
    goTo((activeIndex + 1) % slides.length);
  }, [activeIndex, slides.length, goTo]);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    timerRef.current = setTimeout(next, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, paused, slides.length, next]);

  const slide = slides[activeIndex];

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative w-full rounded-2xl overflow-hidden flex items-stretch min-h-[140px] sm:min-h-[180px] transition-colors duration-500"
        style={{ backgroundColor: slide.bgColor }}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* Slide content — fades on transition */}
        <div
          className={`flex w-full transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}
        >
          {/* Left content */}
          <div className="flex-1 flex flex-col justify-center px-4 py-3 sm:px-5 sm:py-5 gap-2 sm:gap-3 z-10">
            {/* Trust badges */}
            <div className="flex flex-wrap gap-1.5">
              {slide.trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="text-[11px] font-medium text-brand border border-brand/30 bg-white/60 rounded-full px-2.5 py-0.5"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Headline */}
            <h2 className="text-[16px] sm:text-[18px] font-bold text-ink leading-snug whitespace-pre-line">
              {slide.headlineBefore}
              <span className="text-brand">{slide.headlineHighlight}</span>
              {slide.headlineAfter}
            </h2>

            {/* Subtitle */}
            <p className="text-[11px] sm:text-xs text-ink-muted leading-relaxed whitespace-pre-line">
              {slide.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-2">
              <Link
                href={slide.primaryCta.href}
                className="bg-brand text-white text-[11px] font-semibold px-3 py-2 rounded-lg hover:bg-[#0f4a0c] transition-colors whitespace-nowrap"
              >
                {slide.primaryCta.label}
              </Link>
              <Link
                href={slide.secondaryCta.href}
                className="bg-white text-brand border border-brand text-[11px] font-semibold px-3 py-2 rounded-lg hover:bg-[#f0faf0] transition-colors whitespace-nowrap"
              >
                {slide.secondaryCta.label}
              </Link>
            </div>
          </div>

          {/* Right image */}
          <div className="relative w-[120px] sm:w-[150px] flex-shrink-0 self-stretch overflow-hidden">
            <Image
              src={slide.image}
              alt="Banner"
              fill
              className="object-cover object-right"
              priority
            />
          </div>
        </div>

        {/* Progress bar — shows auto-play countdown */}
        {slides.length > 1 && !paused && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10">
            <div
              key={activeIndex}
              className="h-full bg-brand/60"
              style={{
                animation: `progress ${AUTOPLAY_INTERVAL}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-4 h-2 bg-brand" : "w-2 h-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      {/* Static cosmetic dots for single slide */}
      {slides.length === 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-4 h-2 rounded-full bg-brand" />
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
};

export default PromoBanner;
