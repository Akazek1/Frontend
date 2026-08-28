"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Loader2, MessageSquare } from "lucide-react";
import api from "@/lib/axios";
import { useAgency } from "@/context/agency-context";
import { AgencyCard, AgencyEmpty, AgencyLoading, AgencyPageHeader, Avatar } from "@/components/agency/agency-ui";

type WouldRehire = "YES" | "MAYBE" | "NO";

interface AgencyReview {
  id: string;
  wouldRehire: WouldRehire;
  comment: string | null;
  reply: string | null;
  createdAt: string;
  author: { id: string; firstName: string | null; lastName: string | null; profilePicture: string | null };
}

interface ReviewsResponse {
  reviews: AgencyReview[];
  counts: { YES: number; MAYBE: number; NO: number };
  reviewCount: number;
  wouldRehireRate: number;
}

function RehireBadge({ value, t }: { value: WouldRehire; t: (k: string) => string }) {
  const map: Record<WouldRehire, { emoji: string; key: string; className: string }> = {
    YES: { emoji: "😊", key: "rehireYes", className: "bg-green-50 text-green-700" },
    MAYBE: { emoji: "😐", key: "rehireMaybe", className: "bg-amber-50 text-amber-700" },
    NO: { emoji: "🙁", key: "rehireNo", className: "bg-red-50 text-red-700" },
  };
  const b = map[value];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${b.className}`}>
      <span>{b.emoji}</span> {t(b.key)}
    </span>
  );
}

export default function AgencyReviewsPage() {
  const t = useTranslations("agencyReviews");
  const { org } = useAgency();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!org?.id) return;
    try {
      const res = await api.get(`/agency-reviews/agency/${org.id}`);
      setData(res.data?.data ?? res.data);
    } catch {
      toast.error(t("actionError"));
    } finally {
      setLoading(false);
    }
  }, [org?.id, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitReply(id: string) {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      await api.post(`/agency-reviews/${id}/reply`, { reply: replyText.trim() });
      toast.success(t("replySaved"));
      setReplyingId(null);
      setReplyText("");
      load();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setSaving(false);
    }
  }

  const name = (r: AgencyReview) => `${r.author.firstName ?? ""} ${r.author.lastName ?? ""}`.trim() || t("anonymous");

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 lg:px-6">
      <AgencyPageHeader title={t("title")} subtitle={t("subtitle")} />

      {loading ? (
        <AgencyLoading />
      ) : !data || data.reviewCount === 0 ? (
        <AgencyEmpty title={t("emptyTitle")} hint={t("emptyHint")} />
      ) : (
        <>
          <AgencyCard className="mb-4 flex items-center gap-4 p-5">
            <div className="text-center">
              <p className="text-[32px] font-black leading-none text-ink">{data.wouldRehireRate}%</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t("wouldUseAgain")}</p>
            </div>
            <div className="h-10 w-px bg-gray-100" />
            <div className="text-[12px] text-ink-muted">
              <p>{t("basedOn", { count: data.reviewCount })}</p>
              <p className="mt-1">😊 {data.counts.YES} · 😐 {data.counts.MAYBE} · 🙁 {data.counts.NO}</p>
            </div>
          </AgencyCard>

          <div className="space-y-2.5">
            {data.reviews.map((r) => (
              <AgencyCard key={r.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.author.profilePicture} name={name(r)} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink">{name(r)}</p>
                    <div className="mt-0.5"><RehireBadge value={r.wouldRehire} t={t} /></div>
                  </div>
                </div>
                {r.comment && <p className="mt-2.5 text-[13.5px] text-ink">{r.comment}</p>}

                {r.reply ? (
                  <div className="mt-3 rounded-xl bg-gray-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{t("yourReply")}</p>
                    <p className="mt-1 text-[13px] text-ink">{r.reply}</p>
                  </div>
                ) : replyingId === r.id ? (
                  <div className="mt-3">
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t("replyPlaceholder")}
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-[13px] outline-none focus:border-brand"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => submitReply(r.id)}
                        disabled={saving || !replyText.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {t("sendReply")}
                      </button>
                      <button
                        onClick={() => { setReplyingId(null); setReplyText(""); }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-ink-muted"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setReplyingId(r.id); setReplyText(""); }}
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> {t("replyAction")}
                  </button>
                )}
              </AgencyCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
