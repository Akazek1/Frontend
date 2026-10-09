"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { HuzaLogo } from "@/components/brand/huza-logo";
import { SUPPORT_BADGE_COLOR, VerifiedBadge } from "@/components/ui/verified-badge";
import { goBackOr } from "@/lib/navigation";

/**
 * "Chat info" for the Huza Support thread — who you are talking to and how to
 * tell it is really Huza. Opened by tapping the header of the support chat.
 */
export default function SupportChatInfoPage() {
  const t = useTranslations("supportInfo");
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-surface">
      <header className="sticky top-0 z-20 flex items-center bg-surface px-4 py-3">
        <button
          onClick={() => goBackOr(router, `/conversations/thread/${id}`)}
          aria-label={t("back")}
          className="rounded-full p-1 hover:bg-black/5"
        >
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="flex-1 pr-8 text-center text-sm font-bold text-ink">{t("title")}</h1>
      </header>

      <div className="flex flex-col items-center px-6 pb-6 pt-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand">
          <HuzaLogo variant="mark" tone="light" markClassName="h-14 w-14" />
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          <h2 className="text-2xl font-black text-ink">{t("name")}</h2>
          <VerifiedBadge size={22} fill={SUPPORT_BADGE_COLOR} />
        </div>
        <p className="mt-1 text-sm text-ink-subtle">{t("officialAccount")}</p>
      </div>

      <div className="mx-4 mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink">
          <p>{t("intro")}</p>
          <p>{t("whatFor")}</p>
          <p>{t("safety")}</p>
        </div>
        <a
          href="https://huza.app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block border-t border-gray-100 pt-3 text-[15px] font-semibold text-brand"
        >
          https://huza.app
        </a>
      </div>
    </div>
  );
}
