/**
 * Job Post detail page — owner view ("View Applicants").
 *
 * Mirrors the design mockup: header, job details card, stats row,
 * applicant tabs/search/sort, applicant cards with Message/Hire/Reject.
 *
 * Only used when the authenticated user owns the job post; the worker view
 * (apply, report, etc.) lives in `app/jobs/[id]/page.tsx`.
 */
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eye,
  Loader2,
  MapPin,
  MessageCircleMore,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import jobsService, { Job, JobApplication } from "@/services/jobs-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type StatusFilter = "all" | "hired" | "rejected";
type SortKey = "newest" | "oldest" | "name";

export default function JobOwnerDetail({
  job,
  applications,
  onApplicationStatusChange,
  onJobStatusChange,
}: {
  job: Job;
  applications: JobApplication[];
  onApplicationStatusChange: (id: string, status: JobApplication["status"]) => void;
  onJobStatusChange: (status: Job["status"]) => void;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [actingId, setActingId] = useState<string | null>(null);
  const [confirmHire, setConfirmHire] = useState<JobApplication | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closingPost, setClosingPost] = useState(false);

  const counts = useMemo(
    () => ({
      all: applications.length,
      hired: applications.filter((a) => a.status === "ACCEPTED").length,
      rejected: applications.filter((a) => a.status === "REJECTED").length,
      pending: applications.filter((a) => a.status === "PENDING").length,
    }),
    [applications],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = applications.filter((app) => {
      if (statusFilter === "hired") return app.status === "ACCEPTED";
      if (statusFilter === "rejected") return app.status === "REJECTED";
      return true; // "all"
    });
    if (term) {
      list = list.filter((app) => {
        const name = `${app.worker?.firstName || ""} ${app.worker?.lastName || ""}`.toLowerCase();
        return name.includes(term);
      });
    }
    if (sort === "name") {
      list = [...list].sort((a, b) => {
        const an = `${a.worker?.firstName || ""} ${a.worker?.lastName || ""}`;
        const bn = `${b.worker?.firstName || ""} ${b.worker?.lastName || ""}`;
        return an.localeCompare(bn);
      });
    } else if (sort === "oldest") {
      list = [...list].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } else {
      // newest first
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return list;
  }, [applications, statusFilter, search, sort]);

  const statusLabel =
    job.status === "AWARDED" ? "Filled" : job.status[0] + job.status.slice(1).toLowerCase();
  const statusClass =
    job.status === "OPEN"
      ? "bg-[#E7F4E2] text-brand"
      : job.status === "AWARDED"
        ? "bg-[#EDE9FE] text-[#6D28D9]"
        : "bg-gray-100 text-gray-500";

  const handleHire = async () => {
    if (!confirmHire) return;
    const app = confirmHire;
    setConfirmHire(null);
    setActingId(app.id);
    try {
      const result = await jobsService.updateApplicationStatus(app.id, "ACCEPTED");
      onApplicationStatusChange(app.id, "ACCEPTED");
      toast.success("Offer sent. Awaiting worker acceptance.");
      if (result?.bookingId) {
        router.push(`/conversations/inbox/${result.bookingId}`);
      }
    } catch {
      toast.error("Failed to hire worker.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (app: JobApplication) => {
    setActingId(app.id);
    try {
      await jobsService.updateApplicationStatus(app.id, "REJECTED");
      onApplicationStatusChange(app.id, "REJECTED");
      toast.success("Application rejected.");
    } catch {
      toast.error("Failed to reject application.");
    } finally {
      setActingId(null);
    }
  };

  const handleClosePost = async () => {
    setConfirmClose(false);
    setClosingPost(true);
    try {
      await jobsService.updateJob(job.id, { status: "CLOSED" });
      onJobStatusChange("CLOSED");
      toast.success("Job post closed.");
    } catch {
      toast.error("Could not close post.");
    } finally {
      setClosingPost(false);
    }
  };

  const description = job.description || "";

  return (
    <main className="bg-surface min-h-screen pb-24">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-surface sticky top-0 z-20 px-4 pb-3 pt-6 backdrop-blur">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink"
            >
              <ChevronLeftIcon />
            </button>
            <h1 className="truncate text-[17px] font-black text-[#101828]">{job.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/post-job?edit=${job.id}`}
              className="text-[13px] font-black text-brand"
            >
              Edit Post
            </Link>
            <button
              type="button"
              aria-label="More"
              className="flex h-10 w-10 items-center justify-center text-ink"
            >
              <span aria-hidden className="text-[18px] leading-none">⋮</span>
            </button>
          </div>
        </header>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-muted">
          <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold", statusClass)}>
            {statusLabel}
          </span>
          <span className="font-bold text-ink">{counts.all} Applicants</span>
          <span className="text-[#9CA3AF]">•</span>
          <span>Posted {formatRelative(job.createdAt)}</span>
        </div>
      </div>

      <div className="space-y-4 px-4 pt-2">
        {/* ── Job Details Card ───────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-2 text-[14px] font-black text-brand">
              <ClipboardList className="h-4 w-4" />
              Job Details
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/post-job?edit=${job.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand/30 bg-white px-3 text-[12px] font-black text-brand"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Post
              </Link>
              <button
                type="button"
                disabled={closingPost || job.status !== "OPEN"}
                onClick={() => setConfirmClose(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-[12px] font-black text-red-500 disabled:opacity-50"
              >
                {closingPost ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Close Post
              </button>
            </div>
          </div>

          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              {/* Left column — facts */}
              <div className="space-y-3 text-[13px] text-ink">
                <FactRow icon={<MapPin className="h-4 w-4 text-ink-subtle" />}>
                  {formatLocation(job)}
                </FactRow>
                <FactRow icon={<CalendarDays className="h-4 w-4 text-ink-subtle" />}>
                  {formatSchedule(job)}
                </FactRow>
                <FactRow icon={<Banknote className="h-4 w-4 text-ink-subtle" />}>
                  Budget: {formatBudget(job)}
                </FactRow>
              </div>

              {/* Right column — description */}
              <div className="md:border-l md:border-gray-100 md:pl-4">
                <h3 className="text-[13px] font-black text-ink">Description</h3>
                {description ? (
                  <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-muted">
                    {description}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[13px] italic text-[#9CA3AF]">No description provided.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Row ──────────────────────────────────────────── */}
        <section className="grid grid-cols-4 rounded-2xl border border-gray-100 bg-white py-3 shadow-sm">
          <StatTile
            icon={<User className="h-5 w-5 text-brand" />}
            value={counts.all}
            label="Applicants"
            color="text-brand"
          />
          <StatTile
            icon={<Eye className="h-5 w-5 text-[#1155FF]" />}
            value="—"
            label="Views"
            color="text-[#1155FF]"
          />
          <StatTile
            icon={<CheckCircle2 className="h-5 w-5 text-[#1155FF]" />}
            value={counts.hired}
            label="Hired"
            color="text-ink"
          />
          <StatTile
            icon={<XCircleIcon />}
            value={counts.rejected}
            label="Rejected"
            color="text-ink"
          />
        </section>

        {/* ── Filter tabs ────────────────────────────────────────── */}
        <section className="flex gap-2">
          <FilterTab
            label="All Applicants"
            count={counts.all}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            tone="green"
          />
          <FilterTab
            label="Hired"
            count={counts.hired}
            active={statusFilter === "hired"}
            onClick={() => setStatusFilter("hired")}
            tone="neutral"
          />
          <FilterTab
            label="Rejected"
            count={counts.rejected}
            active={statusFilter === "rejected"}
            onClick={() => setStatusFilter("rejected")}
            tone="neutral"
          />
        </section>

        {/* ── Search + Sort ──────────────────────────────────────── */}
        <section className="flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
            <Search className="h-4 w-4 text-ink-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-[#9CA3AF]"
            />
          </label>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-[13px] font-bold text-ink"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          </div>
        </section>

        {/* ── Applicant List ─────────────────────────────────────── */}
        <section className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState statusFilter={statusFilter} />
          ) : (
            filtered.map((app) => (
              <ApplicantCard
                key={app.id}
                app={app}
                isActing={actingId === app.id}
                onHire={() => setConfirmHire(app)}
                onReject={() => void handleReject(app)}
              />
            ))
          )}
        </section>

        {/* ── Safe & Secure footer ───────────────────────────────── */}
        <section className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F4E2]">
            <ShieldCheck className="h-5 w-5 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-black text-ink">Safe &amp; Secure</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              We review all applications and keep your information protected.
            </p>
          </div>
        </section>
      </div>

      {/* ── Hire confirmation modal ─────────────────────────────── */}
      <Dialog open={confirmHire !== null} onOpenChange={(o) => !o && setConfirmHire(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hire this worker?</DialogTitle>
          </DialogHeader>
          {confirmHire && (
            <div className="space-y-4">
              <p className="text-[13px] text-ink-muted">
                This sends an official offer to{" "}
                <span className="font-semibold text-ink">
                  {confirmHire.worker?.firstName} {confirmHire.worker?.lastName}
                </span>
                . The job is only confirmed after they accept.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmHire(null)}>
                  Cancel
                </Button>
                <Button onClick={handleHire} className="bg-brand hover:bg-[#0e4209]">
                  Send Offer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Close post confirmation modal ───────────────────────── */}
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close this post?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[13px] text-ink-muted">
              Closing the post stops accepting new applicants. Existing accepted hires remain
              unaffected.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleClosePost}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Close Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FactRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[13px] text-ink">
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </p>
  );
}

function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      {icon}
      <p className={cn("text-[18px] font-black", color)}>{value}</p>
      <p className="text-[11px] font-bold text-ink">{label}</p>
    </div>
  );
}

function FilterTab({
  label,
  count,
  active,
  onClick,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone: "green" | "neutral";
}) {
  const activeClass = tone === "green" ? "bg-brand text-white" : "bg-ink text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-[12px] font-bold transition-colors",
        active ? `${activeClass} border-transparent` : "border-gray-200 bg-white text-ink",
      )}
    >
      {label} ({count})
    </button>
  );
}

function ApplicantCard({
  app,
  isActing,
  onHire,
  onReject,
}: {
  app: JobApplication;
  isActing: boolean;
  onHire: () => void;
  onReject: () => void;
}) {
  const w = app.worker;
  const name = `${w?.firstName || ""} ${w?.lastName || ""}`.trim() || "Worker";
  const trustScore = w?.trustScore || 0;
  const jobs = w?.jobsCompleted || 0;
  const years = w?.yearsOfExperience;
  const langs = w?.languages || [];
  const status = app.status;

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
      <div className="flex gap-3">
        <Avatar person={w} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[14px] font-black text-ink">{name}</h3>
            {w?.isVerified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" />}
          </div>
          {(trustScore > 0 || jobs > 0) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              {trustScore > 0 && <span className="font-bold text-ink">Trust {trustScore.toFixed(1)}</span>}
              {trustScore > 0 && jobs > 0 && <span className="text-ink-subtle">•</span>}
              {jobs > 0 && <span className="text-ink-subtle">{jobs} jobs done</span>}
            </p>
          )}
          <p className="mt-0.5 text-[12px] text-ink-muted">
            {years ? `${years} year${years === 1 ? "" : "s"} experience` : "Experience not set"}
            {langs.length > 0 && (
              <>
                <span className="mx-1.5 text-[#9CA3AF]">•</span>
                Speaks {langs.join(", ")}
              </>
            )}
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Applied {formatRelative(app.createdAt)}</p>
        </div>

        <div className="flex w-[112px] shrink-0 flex-col gap-1.5">
          <Link
            href={`/conversations`}
            className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-brand/30 bg-white text-[12px] font-black text-brand"
          >
            <MessageCircleMore className="h-3.5 w-3.5" />
            Message
          </Link>
          {status === "PENDING" ? (
            <>
              <button
                type="button"
                disabled={isActing}
                onClick={onHire}
                className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-[12px] font-black text-white disabled:opacity-60"
              >
                {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Briefcase className="h-3.5 w-3.5" />}
                Hire
              </button>
              <button
                type="button"
                disabled={isActing}
                onClick={onReject}
                className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white text-[12px] font-black text-red-500 disabled:opacity-60"
              >
                <XCircleSmall />
                Reject
              </button>
            </>
          ) : (
            <span
              className={cn(
                "flex min-h-9 items-center justify-center gap-1.5 rounded-lg border text-[12px] font-black",
                status === "ACCEPTED"
                  ? "border-brand/30 bg-[#E7F4E2] text-brand"
                  : "border-gray-200 bg-gray-50 text-gray-500",
              )}
            >
              {status === "ACCEPTED" ? "Hired" : "Rejected"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function Avatar({
  person,
}: {
  person?: { firstName?: string; lastName?: string; profilePicture?: string | null };
}) {
  if (person?.profilePicture) {
    return (
      <span className="relative inline-block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100">
        <Image src={person.profilePicture} alt="" fill className="object-cover" />
      </span>
    );
  }
  const initial = (person?.firstName?.[0] || "") + (person?.lastName?.[0] || "");
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[15px] font-black text-ink">
      {initial.toUpperCase() || "A"}
    </span>
  );
}

function EmptyState({ statusFilter }: { statusFilter: StatusFilter }) {
  const text =
    statusFilter === "hired"
      ? "No one has been hired yet."
      : statusFilter === "rejected"
        ? "No applicants have been rejected."
        : "No applicants yet — we'll notify you as people apply.";
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center">
      <User className="mx-auto h-8 w-8 text-gray-300" />
      <p className="mt-3 text-[14px] font-black text-ink">{text}</p>
    </div>
  );
}

// Lucide doesn't ship a plain rotated chevron in the import set, so we use an
// inline svg for the back arrow + a stylized red X for the Rejected stat.
function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
      <X className="h-3 w-3" />
    </span>
  );
}

function XCircleSmall() {
  return (
    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
      <X className="h-2 w-2" strokeWidth={3} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pure helpers (formatting)
// ---------------------------------------------------------------------------

function formatLocation(job: Job): string {
  const a = job.address;
  if (!a) return "Location not set";
  const parts = [a.city, a.district].filter(Boolean) as string[];
  return parts.join(", ") || "Location not set";
}

function formatSchedule(job: Job): string {
  if (job.startDate) {
    try {
      return new Date(job.startDate).toLocaleDateString("en-RW", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      // fall through
    }
  }
  if (job.scheduleType) {
    return job.scheduleType.charAt(0).toUpperCase() + job.scheduleType.slice(1);
  }
  return "Flexible";
}

function formatBudget(job: Job): string {
  if (job.budgetMin && job.budgetMax && job.budgetMin !== job.budgetMax) {
    return `${job.budgetMin.toLocaleString()} – ${job.budgetMax.toLocaleString()} RWF/day`;
  }
  const value = job.budgetMin || job.budgetMax;
  return value ? `${value.toLocaleString()} RWF/day` : "Negotiable";
}

function formatRelative(iso?: string): string {
  if (!iso) return "recently";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}
