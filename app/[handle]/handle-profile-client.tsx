"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { Loader2, Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Service } from "@/types";
import { UserProfileHeader } from "@/components/profile/user-profile-header";
import { AboutMe } from "@/components/profile/about-me";
import { PersonalInfo } from "@/components/profile/personal-info";
import { WhyClientsChooseMe } from "@/components/profile/why-clients-choose-me";
import { ServicesGrid } from "@/components/profile/services-grid";
import { ReportModal } from "@/components/provider/report-modal";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ReviewCard } from "@/components/ReviewCard";
import type { Review } from "@/hooks/useReviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAddressLocation } from "@/lib/location-display";

type AddressLite = {
  street?: string;
  city?: string;
  district?: string;
  sector?: string;
  cell?: string;
  country?: string;
};

type UserProfile = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  profileImages?: string[];
  roles?: string[];
  languages?: string[];
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  email?: string;
  isVerified?: boolean;
  governmentIdStatus?: string;
  createdAt?: string;
  healthStatus?: string;
  preferredWorkTime?: string;
  educationLevel?: string;
  topQualities?: string[];
  addresses?: AddressLite[];
  availability?: Array<{ id: string; dayOfWeek?: number; startTime?: string; endTime?: string }>;
};

type HireItem = {
  bookingId: string;
  status: string;
  createdAt: string;
  partner?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  service?: {
    category?: { name?: string };
  };
};

const hireStatusClass = (status: string) => {
  switch (status) {
    case "COMPLETED": return "bg-brand/10 text-brand";
    case "CONFIRMED": return "bg-blue-50 text-blue-600";
    case "PENDING": return "bg-amber-50 text-amber-600";
    case "CANCELLED": return "bg-red-50 text-red-500";
    default: return "bg-gray-100 text-gray-500";
  }
};

const hireStatusLabel = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "COMPLETED": return t("statusCompleted");
    case "CONFIRMED": return t("statusConfirmed");
    case "PENDING": return t("statusPending");
    case "CANCELLED": return t("statusCancelled");
    default: return status.charAt(0) + status.slice(1).toLowerCase();
  }
};

export function HandleProfileClient() {
  const t = useTranslations("handleProfile");
  const params = useParams<{ handle: string }>();
  const handle = (params?.handle as string) || "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recentHires, setRecentHires] = useState<HireItem[]>([]);
  const [hiresLoading, setHiresLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserNotFound, setIsUserNotFound] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { user, roles: viewerRoles } = useAuth();
  const { requireAuth } = useRequireAuth();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!handle) {
        setError(t("invalidHandle"));
        setLoading(false);
        return;
      }
      try {
        const userResp = await api.get(`/users/username/${handle}`);
        const userData: UserProfile = userResp.data?.data || userResp.data;

        let serviceList: Service[] = [];
        try {
          const svcResp = await api.get(`/services?providerUsername=${handle}`);
          const raw = svcResp.data?.data;
          serviceList = Array.isArray(raw) ? raw : raw?.data || [];
        } catch {
          serviceList = [];
        }

        // Aggregate reviews across all services
        let allReviews: Review[] = [];
        if (serviceList.length > 0) {
          const results = await Promise.all(
            serviceList.map((s) =>
              api.get(`/feedback/service/${s.id}`).catch(() => null)
            )
          );
          for (const r of results) {
            if (!r) continue;
            const data = Array.isArray(r.data) ? r.data : r.data?.data || [];
            allReviews = allReviews.concat(data);
          }
        }

        if (!cancelled) {
          setProfile(userData);
          setServices(serviceList);
          setReviews(allReviews);
          setError(null);
        }
      } catch (err) {
        const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
        if (e?.response?.status === 404) {
          if (!cancelled) setIsUserNotFound(true);
        } else {
          const message = e?.response?.data?.message || e?.message || t("profileNotFound");
          if (!cancelled) {
            setError(message);
            toast.error(message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const isOwner = !!(user?.id && profile?.id && user.id === profile.id);
  // Education is a hiring-relevance signal for providers, not something a
  // worker needs when deciding whether to accept work FROM this profile
  // owner — hide it when a worker views an employer's profile, even if that
  // employer also has a provider/worker role elsewhere. Owners always see
  // their own info regardless.
  const profileOwnerIsEmployer = !!profile?.roles?.includes("EMPLOYER");
  const viewerIsWorker = viewerRoles.includes("WORKER");
  const canSeeEducation = isOwner || !(profileOwnerIsEmployer && viewerIsWorker);

  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;

    async function loadHires() {
      setHiresLoading(true);
      try {
        const resp = await api.get("/bookings", { params: { role: "employer" } });
        const raw = resp.data?.data || resp.data || [];
        if (!cancelled) setRecentHires(Array.isArray(raw) ? raw.slice(0, 3) : []);
      } catch {
        // no hires or not authenticated
      } finally {
        if (!cancelled) setHiresLoading(false);
      }
    }

    loadHires();
    return () => {
      cancelled = true;
    };
  }, [isOwner]);

  const replyToReview = useCallback(async (reviewId: string, reply: string): Promise<boolean> => {
    try {
      const resp = await api.patch(`/feedback/${reviewId}/reply`, { reply });
      const updated = resp.data?.data || resp.data;
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ...updated } : r))
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-surface flex min-h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (isUserNotFound) notFound();

  if (error || !profile) {
    return (
      <div className="bg-surface min-h-screen p-6">
        <p className="text-center text-red-500 py-12">{error || t("profileNotFound")}</p>
      </div>
    );
  }

  const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.username || t("userFallback");
  const addr = profile.addresses?.[0];
  const homeLocation = formatAddressLocation(addr, { includeCountry: true });

  const displayName = profile.firstName || name;

  return (
    <div className="bg-surface min-h-screen pb-8">
      <UserProfileHeader
        name={name}
        handle={profile.username || handle}
        profilePicture={profile.profilePicture}
        isVerified={profile.isVerified}
        governmentIdStatus={profile.governmentIdStatus}
        location={formatAddressLocation(addr)}
        district={addr?.district || addr?.sector}
        sector={addr?.sector}
        city={addr?.city}
        country={addr?.country}
        languages={profile.languages}
        memberSince={profile.createdAt}
        isOwner={isOwner}
      />

      <AboutMe bio={profile.bio} />

      <PersonalInfo
        gender={profile.gender}
        email={profile.email}
        homeLocation={homeLocation}
        healthStatus={profile.healthStatus}
        preferredWorkTime={profile.preferredWorkTime}
        educationLevel={canSeeEducation ? profile.educationLevel : undefined}
      />

      <WhyClientsChooseMe qualities={profile.topQualities} roles={profile.roles} />

      <ServicesGrid services={services} />

      {/* Recent Hires — visible only to the profile owner */}
      {isOwner && (
        <section className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-4">{t("recentHires")}</h2>
          {hiresLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-brand" />
            </div>
          ) : recentHires.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">{t("noHiresYet")}</p>
          ) : (
            <div className="space-y-4">
              {recentHires.map((hire) => {
                const worker = hire.partner;
                const workerName = worker
                  ? `${worker.firstName || ""} ${worker.lastName || ""}`.trim() || worker.username || t("workerFallback")
                  : t("workerFallback");
                const initials = workerName.charAt(0).toUpperCase();
                const serviceLabel =
                  hire.service?.category?.name || t("serviceFallback");
                const dateLabel = hire.createdAt
                  ? new Date(hire.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";
                return (
                  <div key={hire.bookingId} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={worker?.profilePicture} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{workerName}</p>
                      <p className="text-xs text-gray-500 truncate">{serviceLabel}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${hireStatusClass(hire.status)}`}
                      >
                        {hireStatusLabel(hire.status, t)}
                      </span>
                      {dateLabel && (
                        <span className="text-[11px] text-gray-400">{dateLabel}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-4">
            {reviews.length > 0 ? t("reviewsWithCount", { count: reviews.length }) : t("reviews")}
          </h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReply={isOwner ? replyToReview : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Report — only visible to other users, not the profile owner */}
      {!isOwner && (
        <div className="px-4 pt-6 pb-2 flex justify-center">
          <button
            type="button"
            onClick={() => requireAuth(() => setIsReportOpen(true), "report")}
            className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-red-500 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            {t("reportName", { name: displayName })}
          </button>
        </div>
      )}

      {isReportOpen && (
        <ReportModal
          targetId={profile.id}
          targetName={displayName}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}
