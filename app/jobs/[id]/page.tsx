"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import jobsService, { Job, JobApplication } from "@/services/jobs-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReportModal } from "@/components/provider/report-modal";
import {
  CalendarDays,
  MapPin,
  DollarSign,
  CheckCircle2,
  Loader2,
  User,
  ShieldCheck,
  Check,
  X,
  Briefcase,
  Timer,
  Flag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import JobOwnerDetail from "@/components/jobs/job-owner-detail";
import {
  AppButton,
  AppCard,
  EmptyState,
  PageHeader,
  PageShell,
  SheetBody,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPanel,
  appListCardClass,
  appStickyHeaderClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";

function getResponseStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;
  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
}

const JobDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmHire, setConfirmHire] = useState<{ appId: string; workerName: string } | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { requireAuth } = useRequireAuth();
  const isOwner = user?.id === job?.employerId;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const jobData = await jobsService.getJobById(id as string);
        setJob(jobData);

        if (user?.id === jobData.employerId) {
          const apps = await jobsService.getApplicationsForJob(id as string);
          setApplications(apps);
        }
      } catch (err) {
        if (getResponseStatus(err) === 401) {
          // Not authenticated — send to login, then come back
          router.push(`/onboarding?step=login&redirect=/jobs/${id}`);
        } else {
          console.error("Failed to fetch job details:", err);
          toast.error("Job not found");
          router.push("/work");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user?.id, router]);

  const handleDecline = async (appId: string) => {
    setActionLoading(appId);
    try {
      await jobsService.updateApplicationStatus(appId, "REJECTED");
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "REJECTED" } : a));
      toast.success("Application declined.");
    } catch {
      toast.error("Failed to decline application.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHireConfirmed = async () => {
    if (!confirmHire) return;
    const { appId } = confirmHire;
    setConfirmHire(null);
    setActionLoading(appId);
    try {
      const result = await jobsService.updateApplicationStatus(appId, "ACCEPTED");
      setApplications(prev => prev.map(a =>
        a.id === appId
          ? { ...a, status: "ACCEPTED" }
          : a
      ));
      toast.success("Offer sent. The provider needs to accept before the job is confirmed.");
      if (result?.bookingId) {
        router.push(`/conversations/inbox/${result.bookingId}`);
      }
    } catch {
      toast.error("Failed to hire worker. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="app-bg flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!job) return null;

  // Owners get the dedicated "View Applicants" page (matches design mockup).
  // Non-owners (workers, guests) keep the existing job-detail layout below.
  if (isOwner) {
    return (
      <JobOwnerDetail
        job={job}
        applications={applications}
        onApplicationStatusChange={(appId, status) =>
          setApplications((prev) =>
            prev.map((a) => (a.id === appId ? { ...a, status } : a)),
          )
        }
        onJobStatusChange={(status) =>
          setJob((prev) => (prev ? { ...prev, status } : prev))
        }
      />
    );
  }

  return (
    <PageShell padded={false} className="overflow-x-hidden">
      {/* Premium Header */}
      <PageHeader
        title="Job Detail"
        subtitle="Review job requirements and applicants"
        onBack={() => router.back()}
        className={appStickyHeaderClass}
      />

      <div className="space-y-5 px-4 pt-4">
        {/* Main Job Info */}
        <AppCard className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand" />
          
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-surface text-brand text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">
              {job.category.name}
            </span>
            <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
               job.status === 'OPEN' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {job.status}
            </span>
          </div>
          
          <h1 className="text-2xl font-black text-ink leading-tight mb-4">{job.title}</h1>
          
          <div className="mb-6 rounded-2xl bg-gray-50/70 p-4">
            <p className="text-[14px] text-[#616161] leading-relaxed font-medium whitespace-pre-wrap">{job.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#EDF1EC] bg-gray-50/50 p-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-brand">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Budget</p>
                <p className="text-[13px] font-black text-ink">
                  {job.budgetMin ? `${job.budgetMin.toLocaleString()} RWF` : "Negotiable"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#EDF1EC] bg-gray-50/50 p-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-brand">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Schedule</p>
                <p className="text-[13px] font-black text-ink capitalize">{job.scheduleType || "Flexible"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#EDF1EC] bg-gray-50/50 p-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-brand">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Location</p>
                <p className="text-[13px] font-black text-ink truncate">{job.address?.city || "Kigali"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#EDF1EC] bg-gray-50/50 p-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-brand">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Starts</p>
                <p className="text-[13px] font-black text-ink truncate">{job.startDate ? new Date(job.startDate).toLocaleDateString() : "ASAP"}</p>
              </div>
            </div>
          </div>
        </AppCard>

        {/* Employer Card (Worker View) */}
        {!isOwner && (
          <AppCard>
            <h2 className="text-sm font-black text-ink mb-5 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-brand" /> Employer Profile
            </h2>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md ring-1 ring-gray-100">
                <AvatarImage src={job.employer.profilePicture} className="object-cover" />
                <AvatarFallback className="bg-brand/5 text-[20px] font-bold text-brand">
                  {job.employer.firstName[0]}{job.employer.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[16px] font-black text-ink">{job.employer.firstName} {job.employer.lastName}</p>
                  {job.employer.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />}
                </div>
                <p className="text-[12px] text-gray-400 font-medium">Member since {new Date(job.createdAt).getFullYear()}</p>
              </div>
            </div>
            {job.employer.bio && (
              <p className="mt-4 text-[13px] text-[#616161] leading-relaxed font-medium italic italic border-l-2 border-brand/20 pl-4 py-1">
                &ldquo;{job.employer.bio}&rdquo;
              </p>
            )}
          </AppCard>
        )}

        {/* Applicants List (Employer View) */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[15px] font-black text-ink uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand" /> Applicants ({applications.length})
              </h2>
              <div className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-brand uppercase tracking-tighter">Live</span>
              </div>
            </div>

            {applications.length > 0 ? (
              <div className="grid gap-4">
                {applications.map((app) => (
                  <div key={app.id} className={cn(appListCardClass, "group p-5 transition-all hover:border-brand/20")}>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-gray-100">
                          <AvatarImage src={app.worker?.profilePicture} className="object-cover" />
                          <AvatarFallback className="bg-gray-100 text-[14px] font-bold text-gray-400">
                            {app.worker?.firstName?.[0]}{app.worker?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[14px] font-black text-ink group-hover:text-brand transition-colors">{app.worker?.firstName} {app.worker?.lastName}</p>
                            {app.worker?.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-brand" />}
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium">Applied {formatDistanceToNow(new Date(app.createdAt))} ago</p>
                        </div>
                      </div>
                      
                      <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        app.status === 'PENDING' ? 'bg-orange-50 text-orange-600' :
                        app.status === 'ACCEPTED' ? 'bg-green-50 text-green-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {app.status}
                      </div>
                    </div>

                    {app.message && (
                      <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 shadow-inner">
                        <p className="text-[13px] text-[#616161] leading-relaxed font-medium italic">
                          &ldquo;{app.message}&rdquo;
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {app.status === "PENDING" ? (
                        <>
                          <button
                            onClick={() => handleDecline(app.id)}
                            disabled={!!actionLoading}
                            className="flex-1 h-11 rounded-[18px] border-2 border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 font-black text-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                          >
                            {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Decline
                          </button>
                          <button
                            onClick={() => setConfirmHire({ appId: app.id, workerName: `${app.worker?.firstName} ${app.worker?.lastName}` })}
                            disabled={!!actionLoading}
                            className="flex-3 h-11 rounded-[18px] bg-brand hover:bg-brand-dark text-white font-black text-[12px] uppercase tracking-widest transition-all shadow-lg shadow-brand/10 flex items-center justify-center gap-2 grow-[2]"
                          >
                            <Check className="w-4 h-4" /> Send Offer
                          </button>
                        </>
                      ) : (
                        <div className={`w-full h-11 rounded-[18px] flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] italic border shadow-inner ${
                          app.status === "ACCEPTED"
                            ? "bg-green-50 text-green-600 border-green-100"
                            : "bg-gray-50 text-gray-300 border-gray-100"
                        }`}>
                          <ShieldCheck className="w-4 h-4 opacity-70" />
                          {app.status === "ACCEPTED" ? "Offer Sent" : "Declined"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={User}
                title="Waiting for applicants"
                description="We'll notify you as soon as workers start applying for your job."
              />
            )}
          </div>
        )}
      </div>

      {/* Report — only visible to non-owners */}
      {!isOwner && (
        <div className="px-4 pt-2 pb-6 flex justify-center">
          <button
            type="button"
            onClick={() => requireAuth(() => setIsReportOpen(true), "report")}
            className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-red-500 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            Report this job
          </button>
        </div>
      )}

      {/* Report modal */}
      {isReportOpen && job && (
        <ReportModal
          targetId={job.employerId}
          targetName={`${job.employer.firstName} ${job.employer.lastName}`}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Hire confirmation modal */}
      {confirmHire && (
        <>
          <SheetOverlay onClick={() => setConfirmHire(null)} aria-hidden="true" />
          <SheetPanel className="max-w-sm">
            <SheetHeader title={`Send offer to ${confirmHire.workerName}?`} onClose={() => setConfirmHire(null)} className="border-b-0 pb-2" />
            <SheetBody className="pt-2">
              <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                <Check className="w-7 h-7 text-brand" />
              </div>
              <p className="text-[13px] text-gray-400 leading-relaxed">
                This opens a conversation and sends an official offer. The job is only confirmed after {confirmHire.workerName.split(" ")[0]} accepts.
              </p>
            </div>
            </SheetBody>
            <SheetFooter className="flex gap-3">
              <AppButton
                appVariant="secondary"
                onClick={() => setConfirmHire(null)}
                className="flex-1"
              >
                Cancel
              </AppButton>
              <AppButton
                onClick={handleHireConfirmed}
                className="flex flex-1 items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Offer"}
              </AppButton>
            </SheetFooter>
          </SheetPanel>
        </>
      )}
    </PageShell>
  );
};

export default JobDetailPage;
