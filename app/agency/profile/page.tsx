"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { AgencyCard, AgencyLoading, Avatar, StatusPill } from "@/components/agency/agency-ui";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { shouldUnoptimizeImage } from "@/lib/service-display";

interface ProfileWorker {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  isVerified: boolean;
  skill: string | null;
  onJob: boolean;
  available: boolean;
  rating: number;
  reviewCount: number;
}

interface AgencyProfileData {
  org: {
    id: string;
    name: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    website: string | null;
    description: string | null;
    operatingHours: string | null;
    verified: boolean;
  };
  stats: { totalWorkers: number; totalPlacements: number; averageRating: number; reviewCount: number };
  workers: ProfileWorker[];
}

function name(p: { firstName: string | null; lastName: string | null }) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown";
}

const GUARANTEE_TEXT =
  "We offer a 30-day free replacement guarantee for all placements. If it doesn't work out, we will replace the worker for free.";

export default function AgencyProfilePage() {
  const [data, setData] = useState<AgencyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/agency/profile");
        setData(res.data?.data || res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not load profile"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <AgencyLoading />;
  if (error || !data) return <p className="text-[14px] text-ink-muted">{error || "Could not load profile"}</p>;

  const { org, stats, workers } = data;

  return (
    <div className="pb-6">
      {/* Top actions */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/agency" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline">
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-2">
          <StatusPill label="You are the owner" tone="green" className="hidden sm:inline-flex" />
          <button className="flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-dark">
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-ink-muted hover:bg-gray-50">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cover + identity */}
      <AgencyCard className="overflow-hidden">
        <div className="relative h-36 w-full bg-gradient-to-r from-[#0E3F0B] to-[#1B7A2A] sm:h-44">
          {org.coverImageUrl && (
            <Image
              src={org.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized={shouldUnoptimizeImage(org.coverImageUrl)}
            />
          )}
        </div>
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-12 flex flex-col gap-3 sm:-mt-14 sm:flex-row sm:items-end sm:gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow sm:h-28 sm:w-28">
              {org.logoUrl ? (
                <Image
                  src={org.logoUrl}
                  alt={org.name}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                  unoptimized={shouldUnoptimizeImage(org.logoUrl)}
                />
              ) : (
                <span className="text-[28px] font-black text-brand">{org.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[22px] font-black text-ink sm:text-[26px]">{org.name}</h1>
                {org.verified && <VerifiedBadge size={20} />}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted sm:text-[13px]">
                {org.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {org.address}</span>}
                {org.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {org.phone}</span>}
                {org.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {org.email}</span>}
                {org.operatingHours && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {org.operatingHours}</span>}
              </div>
            </div>
          </div>
        </div>
      </AgencyCard>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEFT: about + contact */}
        <div className="flex flex-col gap-4">
          <AgencyCard className="p-5">
            <h2 className="mb-2 text-[15px] font-bold text-ink">About Us</h2>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-muted">
              {org.description ||
                `${org.name} connects trusted, trained and verified household workers with families across Kigali. We specialize in quality, reliability and long-term relationships.`}
            </p>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#EEF8EA] p-3.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <p className="text-[13px] font-bold text-ink">Our Guarantee Policy</p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">{GUARANTEE_TEXT}</p>
              </div>
            </div>
          </AgencyCard>

          <AgencyCard className="p-5">
            <h2 className="mb-3 text-[15px] font-bold text-ink">Contact Information</h2>
            <div className="space-y-3">
              {org.phone && <ContactRow icon={Phone} value={org.phone} />}
              {org.email && <ContactRow icon={Mail} value={org.email} />}
              {org.website && <ContactRow icon={Globe} value={org.website} />}
              {org.address && <ContactRow icon={MapPin} value={org.address} />}
            </div>
          </AgencyCard>

          {org.operatingHours && (
            <AgencyCard className="p-5">
              <h2 className="mb-3 text-[15px] font-bold text-ink">Operating Hours</h2>
              <div className="flex items-center gap-2 text-[13px] text-ink">
                <Clock className="h-4 w-4 text-brand" />
                {org.operatingHours}
              </div>
            </AgencyCard>
          )}
        </div>

        {/* RIGHT (spans 2): stats + workers */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={<Users className="h-5 w-5 text-brand" />} value={stats.totalWorkers} label="Total Workers" />
            <StatCard icon={<Briefcase className="h-5 w-5 text-brand" />} value={stats.totalPlacements} label="Total Placements" />
            <StatCard
              icon={<MessageSquare className="h-5 w-5 text-brand" />}
              value={stats.reviewCount}
              label={stats.reviewCount === 1 ? "Review" : "Reviews"}
            />
          </div>

          {/* Workers */}
          <AgencyCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-ink">Our Workers</h2>
              <Link href="/agency/workers" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline">
                View all workers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {workers.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-4 text-center text-[13px] text-ink-muted">No workers enrolled yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {workers.map((w) => (
                  <Link
                    key={w.id}
                    href={`/agency/workers/${w.id}`}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <Avatar src={w.profilePicture} name={name(w)} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-[14px] font-bold text-ink">{name(w)}</p>
                        {w.isVerified && <VerifiedBadge size={13} />}
                      </div>
                      <p className="truncate text-[12px] text-ink-muted">{w.skill ?? "—"}</p>
                    </div>
                    <StatusPill label={w.onJob ? "On Job" : "Available"} tone={w.onJob ? "amber" : "green"} />
                    <div className="hidden w-20 items-center justify-end gap-1 text-[12px] text-ink-muted sm:flex">
                      <MessageSquare className="h-3.5 w-3.5 text-brand" />
                      <span className="font-bold text-ink">{w.reviewCount}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </AgencyCard>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, value }: { icon: React.ElementType<{ className?: string }>; value: string }) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-ink">
      <Icon className="h-4 w-4 shrink-0 text-brand" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <AgencyCard className="flex flex-col items-center justify-center p-4 text-center">
      {icon}
      <p className="mt-2 text-[22px] font-black leading-none text-ink sm:text-[26px]">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-ink-muted">{label}</p>
    </AgencyCard>
  );
}
