"use client";

import React, { useEffect, useState } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Card, PageShell, appContentClass } from "@/components/ui/app-primitives";
import api from "@/lib/axios";

export interface LegalSection {
  id: number;
  title: string;
  content: string;
}

interface ManagedLegalDoc {
  type: string;
  title: string;
  intro?: string | null;
  sections: LegalSection[];
  version?: number;
  effectiveDate?: string | null;
  updatedAt?: string | null;
}

interface LegalViewProps {
  type: "terms" | "privacy";
  heading: string;
  /** Bundled fallback content — always renders even if the API is unavailable. */
  fallbackIntro?: string;
  fallbackSections: LegalSection[];
}

/**
 * Public, auth-free renderer for legal documents. Prefers admin-managed content
 * from the backend (so Terms/Privacy can be edited without a deploy) and falls
 * back to the bundled constants so the page is never broken or empty.
 */
export default function LegalView({ type, heading, fallbackIntro, fallbackSections }: LegalViewProps) {
  const [doc, setDoc] = useState<ManagedLegalDoc | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/legal/${type}`, { skipAuthRedirect: true });
        const data = res.data?.data || res.data;
        if (!cancelled && data && Array.isArray(data.sections) && data.sections.length > 0) {
          setDoc(data);
        }
      } catch {
        // Fall back to bundled content.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  const intro = doc?.intro ?? fallbackIntro;
  const sections = doc?.sections ?? fallbackSections;
  const lastUpdated = doc?.effectiveDate || doc?.updatedAt;

  return (
    <PageShell className="gap-5 font-urbanist">
      <BackButtonHeader text={heading} />

      {(intro || lastUpdated) && (
        <Card className="space-y-4">
          {lastUpdated && (
            <p className="text-ink-muted font-normal text-sm tracking-[0.2px] font-urbanist">
              Last Updated:{" "}
              {new Date(lastUpdated).toLocaleDateString([], {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {intro && (
            <p className="text-ink-muted font-normal text-sm tracking-[0.2px] font-urbanist leading-relaxed">
              {intro}
            </p>
          )}
        </Card>
      )}

      <div className={`${appContentClass} gap-8`}>
        {sections.map((section) => (
          <section key={section.id} className="space-y-6">
            <h2 className="text-xl leading-6 font-bold text-ink font-urbanist">
              {section.id}. {section.title}
            </h2>
            <p className="text-ink-muted font-normal text-sm tracking-[0.2px] font-urbanist leading-relaxed whitespace-pre-line">
              {section.content}
            </p>
          </section>
        ))}
      </div>

      <Card className="space-y-2">
        <p className="text-ink-muted font-normal text-xs tracking-[0.2px] font-urbanist">
          For questions, contact: support@akazek.rw
        </p>
      </Card>
    </PageShell>
  );
}
