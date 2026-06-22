"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Phone,
    ShieldCheck,
    Star,
    XCircle,
} from "lucide-react";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { colors } from "@/constant/colors";
import {
    AppSectionHeader,
    Card,
    PageHeader,
    PageShell,
} from "@/components/ui/app-primitives";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { profileImageFallback, shouldUnoptimizeImage } from "@/lib/service-display";
import { AgencyPlacement } from "@/types";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-RW", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function getCoverageEndDate(placedAt: string) {
    const d = new Date(placedAt);
    d.setDate(d.getDate() + 30);
    return d;
}

function getDaysRemaining(placedAt: string) {
    const end = getCoverageEndDate(placedAt);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

const STATUS_CONFIG = {
    ACTIVE: {
        label: "Active Placement",
        icon: CheckCircle2,
        color: "#145B10",
        bg: "#EEF8EA",
    },
    TERMINATED: {
        label: "Terminated",
        icon: XCircle,
        color: "#DC2626",
        bg: "#FEF2F2",
    },
    OPTED_OUT: {
        label: "Worker Opted Out",
        icon: AlertTriangle,
        color: "#D97706",
        bg: "#FFFBEB",
    },
} as const;

export default function PlacementDetailPage() {
    const params = useParams();
    const router = useRouter();
    const placementId = params.id as string;

    const [placement, setPlacement] = useState<AgencyPlacement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!placementId) return;
        async function fetchPlacement() {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/placements/${placementId}`);
                setPlacement(res.data?.data || res.data);
            } catch (err) {
                setError(getApiErrorMessage(err, "Placement not found"));
            } finally {
                setLoading(false);
            }
        }
        fetchPlacement();
    }, [placementId]);

    if (loading) {
        return (
            <PageShell bottomNav={false}>
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
                </div>
            </PageShell>
        );
    }

    if (error || !placement) {
        return (
            <PageShell bottomNav={false}>
                <PageHeader title="Placement" onBack={() => router.back()} />
                <div className="mt-8 text-center text-[14px] text-ink-muted">{error || "Placement not found"}</div>
            </PageShell>
        );
    }

    const status = STATUS_CONFIG[placement.status];
    const StatusIcon = status.icon;
    const daysRemaining = placement.status === "ACTIVE" ? getDaysRemaining(placement.placedAt) : 0;
    const coverageEnd = getCoverageEndDate(placement.placedAt);
    const isCovered = placement.status === "ACTIVE" && daysRemaining > 0;

    const workerPhoto = placement.worker.profilePicture || profileImageFallback;
    const workerName = `${placement.worker.firstName} ${placement.worker.lastName}`;
    const workerHandle = placement.worker.username ? `/${placement.worker.username}` : null;

    return (
        <PageShell bottomNav={false} padded>
            <PageHeader
                title="Placement Details"
                onBack={() => router.back()}
                compact
            />

            <div className="mt-5 flex flex-col gap-4">
                {/* Status badge */}
                <div
                    className="flex items-center gap-2 rounded-xl px-4 py-3"
                    style={{ backgroundColor: status.bg }}
                >
                    <StatusIcon className="h-5 w-5 flex-shrink-0" style={{ color: status.color }} />
                    <span className="text-[14px] font-bold" style={{ color: status.color }}>
                        {status.label}
                    </span>
                    <span className="ml-auto text-[12px] font-medium text-ink-muted">
                        Since {formatDate(placement.placedAt)}
                    </span>
                </div>

                {/* Worker card */}
                <div>
                    <AppSectionHeader title="Worker" className="mb-2" />
                    <Card>
                        <div className="flex items-center gap-3 p-4">
                            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
                                <Image
                                    src={workerPhoto}
                                    alt={workerName}
                                    fill
                                    sizes="56px"
                                    className="object-cover object-top"
                                    unoptimized={shouldUnoptimizeImage(workerPhoto)}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[15px] font-bold text-ink truncate">{workerName}</span>
                                    {placement.worker.isVerified && <VerifiedBadge size={15} />}
                                </div>
                                {placement.worker.services && placement.worker.services[0] && (
                                    <p className="mt-0.5 text-[12px] text-ink-muted truncate">
                                        {placement.worker.services[0].title}
                                    </p>
                                )}
                                <div className="mt-1 flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <span className="text-[12px] font-semibold text-ink">
                                        {placement.worker.trustScore?.toFixed(1) ?? "—"}
                                    </span>
                                    <span className="text-[12px] text-ink-muted">Trust Score</span>
                                </div>
                            </div>
                            {workerHandle && (
                                <Link
                                    href={workerHandle}
                                    className="flex-shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                                    style={{ borderColor: colors.primary, color: colors.primary }}
                                >
                                    View Profile
                                </Link>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Agency card */}
                <div>
                    <AppSectionHeader title="Staffing Agency" className="mb-2" />
                    <Card>
                        <div className="flex items-start gap-3 p-4">
                            {placement.agency.logoUrl ? (
                                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-100">
                                    <Image
                                        src={placement.agency.logoUrl}
                                        alt={placement.agency.name}
                                        width={48}
                                        height={48}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: colors.backgroundTertiary }}
                                >
                                    <span className="text-[18px] font-bold" style={{ color: colors.primary }}>
                                        {placement.agency.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                    <span className="truncate text-[15px] font-bold text-ink">
                                        {placement.agency.name}
                                    </span>
                                    {placement.agency.verified && <VerifiedBadge size={15} />}
                                </div>
                                {placement.agency._count && (
                                    <p className="mt-0.5 text-[12px] text-ink-muted">
                                        {placement.agency._count.workers} Workers · {placement.agency._count.placements} Placements
                                    </p>
                                )}
                                {placement.agency.phone && (
                                    <a
                                        href={`tel:${placement.agency.phone}`}
                                        className="mt-1 flex items-center gap-1 text-[12px] font-medium"
                                        style={{ color: colors.primary }}
                                    >
                                        <Phone className="h-3 w-3" />
                                        {placement.agency.phone}
                                    </a>
                                )}
                            </div>
                            <Link
                                href={`/organization/${placement.agency.id}`}
                                className="flex-shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                                style={{ borderColor: colors.primary, color: colors.primary }}
                            >
                                Profile
                            </Link>
                        </div>

                        {/* Trust badges */}
                        <div
                            className="flex items-center gap-4 border-t px-4 py-3 flex-wrap"
                            style={{ borderColor: colors.border }}
                        >
                            {["ID Verified", "Police Checked", "Replacement Guaranteed"].map((badge) => (
                                <span key={badge} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: colors.primary }}>
                                    <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Coverage / Hiring Protection */}
                <div>
                    <AppSectionHeader title="Hiring Protection" className="mb-2" />
                    <Card className={isCovered ? "border-[#C8E6C4] bg-[#EEF8EA]" : ""}>
                        <div className="flex items-start gap-3 p-4">
                            <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: isCovered ? "#D4EDDA" : "#F3F4F6" }}
                            >
                                <ShieldCheck
                                    className="h-5 w-5"
                                    style={{ color: isCovered ? colors.primary : "#9CA3AF" }}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                {isCovered ? (
                                    <>
                                        <p className="text-[13px] font-bold text-ink">
                                            Your placement is covered
                                        </p>
                                        <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                                            If this worker doesn&apos;t work out, {placement.agency.name} will provide a free replacement.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[13px] font-bold text-ink">Coverage expired</p>
                                        <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                                            The 30-day replacement guarantee has ended.
                                        </p>
                                    </>
                                )}
                            </div>
                            {isCovered && (
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-[11px] font-bold" style={{ color: colors.primary }}>
                                        {daysRemaining} days left
                                    </p>
                                    <p className="text-[10px] text-ink-muted">
                                        Until {formatDate(coverageEnd.toISOString())}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Placement timeline */}
                <div>
                    <AppSectionHeader title="Timeline" className="mb-2" />
                    <Card>
                        <div className="flex flex-col divide-y" style={{ borderColor: colors.border }}>
                            <div className="flex items-center gap-3 p-4">
                                <Calendar className="h-4 w-4 flex-shrink-0 text-brand" />
                                <span className="text-[13px] text-ink-muted">Placement Date</span>
                                <span className="ml-auto text-[13px] font-semibold text-ink">
                                    {formatDate(placement.placedAt)}
                                </span>
                            </div>
                            {placement.endedAt && (
                                <div className="flex items-center gap-3 p-4">
                                    <Clock className="h-4 w-4 flex-shrink-0 text-ink-muted" />
                                    <span className="text-[13px] text-ink-muted">Ended</span>
                                    <span className="ml-auto text-[13px] font-semibold text-ink">
                                        {formatDate(placement.endedAt)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Actions */}
                {placement.status === "ACTIVE" && (
                    <div className="flex flex-col gap-2 pb-6">
                        <Link
                            href={`/placements/${placementId}/report`}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 text-[15px] font-bold"
                            style={{ borderColor: "#DC2626", color: "#DC2626" }}
                        >
                            <AlertTriangle className="h-5 w-5" />
                            Report an Issue
                        </Link>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
