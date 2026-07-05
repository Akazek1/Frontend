"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Send, ShieldCheck, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { goBackOr } from "@/lib/navigation";
import { colors } from "@/constant/colors";
import { useAuth } from "@/hooks/useAuth";
import { AgencyInquiry, INQUIRY_STATUS, inquiryPersonName } from "@/constant/agency-inquiries";

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();

  const [inquiry, setInquiry] = useState<AgencyInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await api.get(`/inquiries/${id}`);
      setInquiry(res.data?.data || res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Inquiry not found"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [inquiry?.messages?.length]);

  // Poll for new messages/status while the conversation is live.
  useEffect(() => {
    const active = inquiry?.status === "TALKING" || inquiry?.status === "HANDED_OVER";
    if (!active) return;
    const t = setInterval(() => { load(); }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry?.status]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }
  if (error || !inquiry) {
    return (
      <div className="p-4">
        <button onClick={() => goBackOr(router, "/inquiries")} className="mb-4 flex items-center gap-2 text-sm font-medium text-ink">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <p className="text-sm text-ink-muted">{error || "Inquiry not found"}</p>
      </div>
    );
  }

  const meId = user?.id;
  const isEmployer = meId === inquiry.employer.id;
  const isHandoverWorker = meId === inquiry.handoverWorker?.id;
  const st = INQUIRY_STATUS[inquiry.status];

  async function sendMessage() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await api.post(`/inquiries/${id}/messages`, { content: draft.trim() });
      setDraft("");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not send message"));
    } finally {
      setBusy(false);
    }
  }

  async function acceptHandover() {
    setBusy(true);
    try {
      await api.post(`/inquiries/${id}/handover/accept`);
      toast.success("You're confirmed! A booking has been created.");
      router.push("/conversations");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not accept"));
      setBusy(false);
    }
  }

  async function declineHandover() {
    setBusy(true);
    try {
      await api.post(`/inquiries/${id}/handover/decline`);
      toast.success("Offer declined.");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not decline"));
    } finally {
      setBusy(false);
    }
  }

  async function cancelInquiry() {
    if (!confirm("Withdraw this inquiry? The agency will be notified.")) return;
    setBusy(true);
    try {
      await api.post(`/inquiries/${id}/cancel`);
      toast.success("Inquiry withdrawn.");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not cancel"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[428px] flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={() => goBackOr(router, "/inquiries")} aria-label="Back"><ArrowLeft className="h-5 w-5 text-ink" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{inquiry.agency?.name ?? "Agency"}</p>
          <p className="text-[11px] text-ink-muted">{st.label}</p>
        </div>
        <span className="rounded-full bg-[#EEF8EA] px-2.5 py-1 text-[11px] font-bold text-brand">{st.label}</span>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Worker hand-over offer */}
        {isHandoverWorker && inquiry.status === "HANDED_OVER" && (
          <div className="rounded-2xl border border-[#C8E6C4] bg-[#EEF8EA] p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <p className="text-[14px] font-bold text-ink">Placement offer</p>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              <span className="font-semibold text-ink">{inquiry.agency?.name}</span> wants to place you with{" "}
              <span className="font-semibold text-ink">{inquiryPersonName(inquiry.employer)}</span>.
            </p>
            <div className="mt-3 rounded-xl bg-white/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Employer&apos;s note</p>
              <p className="mt-1 text-[13px] text-ink">{inquiry.note}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={acceptHandover}
                disabled={busy}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-[14px] font-bold text-white disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Accept</>}
              </button>
              <button
                onClick={declineHandover}
                disabled={busy}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-[14px] font-bold text-ink disabled:opacity-60"
              >
                <XCircle className="h-5 w-5" /> Decline
              </button>
            </div>
          </div>
        )}

        {isHandoverWorker && inquiry.status === "CONVERTED" && (
          <div className="rounded-2xl border border-[#C8E6C4] bg-[#EEF8EA] p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-brand" />
            <p className="text-[14px] font-bold text-ink">You accepted this placement</p>
            <button onClick={() => router.push("/conversations")} className="mt-3 text-[13px] font-semibold text-brand underline">
              Go to your bookings
            </button>
          </div>
        )}

        {/* Employer: note recap + conversation */}
        {isEmployer && (
          <>
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Your inquiry</p>
              <p className="mt-1 text-[13px] text-ink">{inquiry.note}</p>
              {inquiry.status === "PENDING" && (
                <p className="mt-2 text-[12px] text-ink-muted">Waiting for {inquiry.agency?.name} to respond…</p>
              )}
              {inquiry.status === "CONVERTED" && (
                <button onClick={() => router.push("/conversations")} className="mt-2 text-[13px] font-semibold text-brand underline">
                  Worker confirmed — go to your bookings
                </button>
              )}
              {(inquiry.status === "PENDING" || inquiry.status === "TALKING" || inquiry.status === "HANDED_OVER") && (
                <button
                  onClick={cancelInquiry}
                  disabled={busy}
                  className="mt-3 h-10 w-full rounded-xl border-2 border-[#FBD5D5] text-[13px] font-bold text-[#DC2626] hover:bg-[#FEF2F2] disabled:opacity-60"
                >
                  Withdraw inquiry
                </button>
              )}
              {(inquiry.status === "CLOSED" || inquiry.status === "DECLINED") && (
                <p className="mt-2 text-[12px] text-ink-muted">
                  This inquiry is {inquiry.status === "CLOSED" ? "withdrawn" : "declined"}.
                </p>
              )}
            </div>

            {(inquiry.status === "TALKING" || (inquiry.messages?.length ?? 0) > 0) && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="mb-2 text-[13px] font-bold text-ink">Conversation</p>
                <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
                  {(inquiry.messages ?? []).length === 0 && (
                    <p className="py-6 text-center text-[13px] text-ink-muted">No messages yet.</p>
                  )}
                  {(inquiry.messages ?? []).map((m) => {
                    const mine = m.senderId === meId;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[13px] ${mine ? "bg-brand text-white" : "bg-gray-100 text-ink"}`}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Employer composer (only while talking) */}
      {isEmployer && inquiry.status === "TALKING" && (
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-gray-100 bg-white p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            placeholder="Type a message…"
            className="h-11 flex-1 rounded-xl border border-gray-200 px-3 text-[14px] outline-none focus:border-brand"
          />
          <button onClick={sendMessage} disabled={busy || !draft.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-50">
            <Send className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
