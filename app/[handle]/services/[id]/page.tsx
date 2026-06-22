"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Bookmark,
    Briefcase,
    Pencil,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Coins,
    Flag,
    Home as HomeIcon,
    Loader2,
    MapPin,
    MessageCircle,
    PanelTop,
    Share as ShareIcon,
    ShieldCheck,
    Shirt,
    Smile,
    Sparkles,
    Star,
    UtensilsCrossed,
    Users,
    X,
} from "lucide-react";

import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { formatPrice } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
    getProviderHandle,
    getProviderName,
    getServiceImages,
    profileImageFallback,
    serviceImageFallback,
    shouldUnoptimizeImage,
} from "@/lib/service-display";
import { colors } from "@/constant/colors";
import {
    DEFAULT_CATEGORY_ICON,
    PROVIDER_STATS,
    SERVICE_CATEGORY_ICONS,
    SERVICE_DETAIL_LABELS,
} from "@/constant/service-detail";
import { Service } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ReportModal } from "@/components/provider/report-modal";
import { ReviewCard } from "@/components/ReviewCard";
import { useReviews } from "@/hooks/useReviews";
import toast from "react-hot-toast";

const LUCIDE: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Briefcase,
    ClipboardCheck,
    Clock,
    Users,
    Star,
    Smile,
    Home: HomeIcon,
    Sparkles,
    UtensilsCrossed,
    Shirt,
    PanelTop,
};

interface ExistingBookingSummary {
    status?: string;
    service?: {
        id?: string;
    };
}

function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceId = params.id as string;
    const { user, isAuthenticated } = useAuth();
    const { requireAuth } = useRequireAuth();

    const [service, setService] = useState<Service | null>(null);
    const [providerServices, setProviderServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bioExpanded, setBioExpanded] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
    const openLightbox = (images: string[], index: number) => setLightbox({ images, index });
    const closeLightbox = () => setLightbox(null);
    const lightboxPrev = () => setLightbox(lb => lb && lb.index > 0 ? { ...lb, index: lb.index - 1 } : lb);
    const lightboxNext = () => setLightbox(lb => lb && lb.index < lb.images.length - 1 ? { ...lb, index: lb.index + 1 } : lb);
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);
    const [hireNotes, setHireNotes] = useState("");
    // Agency-backed workers: employer contacts the agency (an inquiry), not a direct booking.
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [inquiryNote, setInquiryNote] = useState("");
    const [inquirySubmitting, setInquirySubmitting] = useState(false);
    const [inquirySent, setInquirySent] = useState(false);

    useEffect(() => {
        async function fetchService() {
            if (!serviceId) return;
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/services/${serviceId}`);
                const nextService = res.data?.data || res.data;
                setService(nextService);
                const providerId = nextService?.provider?.id || nextService?.providerId;
                if (providerId) {
                    const servicesRes = await api.get(`/services?providerId=${providerId}`);
                    const data = Array.isArray(servicesRes.data?.data)
                        ? servicesRes.data.data
                        : servicesRes.data?.data?.data || [];
                    setProviderServices(data);
                }
            } catch (err) {
                setError(getApiErrorMessage(err, SERVICE_DETAIL_LABELS.serviceNotFound));
            } finally {
                setLoading(false);
            }
        }
        fetchService();
    }, [serviceId]);

    useEffect(() => {
        if (!serviceId) return;
        const fetchExisting = async () => {
            try {
                const res = await api.get("/bookings", { params: { role: "employer" } });
                const bookings = Array.isArray(res.data?.data)
                    ? res.data.data
                    : Array.isArray(res.data)
                    ? res.data
                    : [];
                const inactive = new Set(["CANCELLED", "REJECTED"]);
                const found = (bookings as ExistingBookingSummary[]).some(
                    (booking) =>
                        booking.service?.id === serviceId &&
                        !inactive.has(String(booking.status).toUpperCase())
                );
                setHasRequested(found);
            } catch {
                // silent
            }
        };
        fetchExisting();
    }, [serviceId]);

    // Keyboard navigation and swipe for lightbox
    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") lightboxPrev();
            else if (e.key === "ArrowRight") lightboxNext();
            else if (e.key === "Escape") closeLightbox();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lightbox]);

    // Deep-link from a list card's "Contact Agency": open the same inquiry
    // modal the profile button opens, then drop the flag so closing it
    // doesn't re-trigger.
    useEffect(() => {
        if (!service?.provider?.agency) return;
        if (searchParams.get("contact") !== "agency") return;
        requireAuth(() => setIsInquiryOpen(true), "hire");
        router.replace(`/${params.handle}/services/${serviceId}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [service, searchParams]);

    const provider = service?.provider;
    const providerName = useMemo(() => getProviderName(provider), [provider]);
    const providerHandle = useMemo(() => getProviderHandle(provider), [provider]);
    const profilePath = `/${providerHandle.replace(/^@/, "")}`;
    const firstName = provider?.firstName || providerName.split(" ")[0] || "Provider";

    const serviceImages = useMemo(() => getServiceImages(service), [service]);
    const workPhotos = serviceImages;

    const providerPhoto =
        provider?.profilePicture || provider?.profileImg || profileImageFallback;

    // Real languages only — the "Speaks" row is hidden when none are set.
    const languages = provider?.languages ?? [];
    const educationLevel = provider?.educationLevel;

    const isVerified = provider?.isVerified ?? false;
    const availableToday = service?.isActive !== false && (service?.provider?.availableForWork ?? true);

    // "About" shows the service description the provider actually wrote, falling
    // back to their profile bio. When both are empty the section is hidden —
    // never a placeholder paragraph.
    const aboutText = (service?.description || provider?.bio || "").trim();

    const priceText = useMemo(() => {
        if (!service) return "Price on request";
        return formatPrice(service.priceMin, service.priceMax, service.priceType) || "Price on request";
    }, [service]);

    // Real stats only. Counts are 0 for a new provider; rating reads "New"
    // until the first review; years shows "—" when not provided.
    const totalReviews = service?.reviews?.totalReviews ?? 0;
    const statDisplay: Record<string, string> = {
        years:
            provider?.yearsOfExperience != null
                ? String(provider.yearsOfExperience)
                : "—",
        jobs: String(service?.reviews?.jobsCompleted ?? 0),
        rating: totalReviews > 0 ? (service?.reviews?.averageRating ?? 0).toFixed(1) : "New",
        rehire: String(service?.reviews?.wouldHireAgain ?? 0),
    };

    const servicesOffered = useMemo(() => {
        const derived = providerServices
            .map((s) => (typeof s.category === "string" ? s.category : s.category?.name))
            .filter((v): v is string => Boolean(v));
        return Array.from(new Set(derived));
    }, [providerServices]);

    const locationText = useMemo(() => {
        const raw = service?.serviceAreas;
        const areas = Array.isArray(raw) ? raw : raw ? [raw as unknown as string] : [];
        return areas[0] || "";
    }, [service]);

    const messageHref = "/conversations";

    // Owner-only UI (e.g. "Edit Service") must require a genuine session — not
    // just a stale persisted `user`. `user` is hydrated from localStorage
    // independently of the token, so a logged-out visitor can still carry a
    // `user` object; gate on isAuthenticated (token-backed) to be safe.
    const isOwnService = Boolean(
        isAuthenticated && user?.id && service && (service.providerId === user.id || service.provider?.id === user.id)
    );

    const openHireModal = () => {
        if (!service || hasRequested) return;
        if (isOwnService) {
            toast.error("You can't book your own service.");
            return;
        }
        setHireNotes("");
        setIsHireModalOpen(true);
    };

    const handleInquirySubmit = async () => {
        if (!service?.provider?.agency || inquirySubmitting) return;
        if (inquiryNote.trim().length < 5) {
            toast.error("Please add a short note about what you need.");
            return;
        }
        setInquirySubmitting(true);
        try {
            await api.post("/inquiries", {
                agencyId: service.provider.agency.id,
                workerOfInterestId: service.provider.id,
                note: inquiryNote.trim(),
            });
            toast.success(`Inquiry sent to ${service.provider.agency.name}!`);
            setInquirySent(true);
            setIsInquiryOpen(false);
            setInquiryNote("");
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Failed to send inquiry."));
        } finally {
            setInquirySubmitting(false);
        }
    };

    const handleHireSubmit = async () => {
        if (!service || submitting || hasRequested) return;
        setSubmitting(true);
        try {
            await api.post("/bookings", {
                serviceId: service.id,
                ...(hireNotes.trim() ? { notes: hireNotes.trim() } : {}),
            });
            toast.success(`Booking request sent to ${firstName}!`);
            setHasRequested(true);
            setIsHireModalOpen(false);
            setHireNotes("");
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Failed to send request."));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div
                className="flex min-h-screen items-center justify-center"
                style={{ backgroundColor: colors.background }}
            >
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen p-4" style={{ backgroundColor: colors.background }}>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: colors.text }}
                >
                    <ArrowLeft className="h-5 w-5" /> Back
                </button>
                <div className="mt-6 rounded-lg bg-white p-6 text-center text-sm text-red-500">
                    {error || SERVICE_DETAIL_LABELS.serviceNotFound}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface min-h-screen w-full overflow-x-hidden pb-28">
            {/* Top bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 pb-2 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Go back"
                    className="-ml-1 p-1"
                >
                    <ArrowLeft className="h-6 w-6" style={{ color: colors.text }} />
                </button>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        aria-label="Share"
                        onClick={async () => {
                            const url = window.location.href;
                            // 1) Native share sheet — must be called before any
                            // `await` to keep the user-activation it requires.
                            if (typeof navigator !== "undefined" && navigator.share) {
                                try {
                                    await navigator.share({ title: providerName, url });
                                    return;
                                } catch (e) {
                                    // User dismissed the sheet — don't fall through.
                                    if ((e as { name?: string })?.name === "AbortError") return;
                                }
                            }
                            // 2) Async clipboard (secure contexts, focused tab).
                            try {
                                if (navigator.clipboard && window.isSecureContext) {
                                    await navigator.clipboard.writeText(url);
                                    toast.success("Link copied to clipboard");
                                    return;
                                }
                            } catch {
                                /* fall through to legacy copy */
                            }
                            // 3) Legacy execCommand copy (works in more contexts).
                            try {
                                const ta = document.createElement("textarea");
                                ta.value = url;
                                ta.setAttribute("readonly", "");
                                ta.style.position = "fixed";
                                ta.style.opacity = "0";
                                document.body.appendChild(ta);
                                ta.select();
                                const ok = document.execCommand("copy");
                                document.body.removeChild(ta);
                                if (ok) {
                                    toast.success("Link copied to clipboard");
                                    return;
                                }
                            } catch {
                                /* fall through to manual copy */
                            }
                            // 4) Last resort — surface the link so it can be copied.
                            toast(`Copy this link: ${url}`, { duration: 6000 });
                        }}
                        className="p-1"
                    >
                        <ShareIcon className="h-5 w-5" style={{ color: colors.text }} />
                    </button>
                    {!isOwnService && (
                        <button
                            type="button"
                            aria-label="Bookmark"
                            onClick={() => requireAuth(() => setBookmarked((v) => !v))}
                            className="p-1"
                        >
                            <Bookmark
                                className="h-5 w-5"
                                style={{ color: colors.text }}
                                fill={bookmarked ? colors.text : "none"}
                            />
                        </button>
                    )}
                </div>
            </div>

            <main className="mx-auto w-full max-w-md px-4 pt-2">
                {/* Profile header */}
                <section className="flex items-start gap-4">
                    {/* Avatar with Available Today pill */}
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => openLightbox([providerPhoto], 0)}
                            aria-label={`View ${providerName}'s photo`}
                            className="relative block h-[120px] w-[120px] overflow-hidden rounded-full bg-gray-100"
                        >
                            <Image
                                src={providerPhoto}
                                alt={providerName}
                                fill
                                sizes="120px"
                                className="object-cover object-top"
                                unoptimized={shouldUnoptimizeImage(providerPhoto)}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = profileImageFallback;
                                }}
                            />
                        </button>
                        <div
                            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold text-white ${availableToday ? "bg-brand/85" : "bg-red-600/85"}`}
                        >
                            {availableToday ? SERVICE_DETAIL_LABELS.availableToday : "Unavailable"}
                        </div>
                    </div>

                    {/* Right side: name/handle/title/meta */}
                    <div className="min-w-0 flex-1 space-y-1.5 pt-1">
                        <Link href={profilePath} className="block group">
                            <div className="flex items-center gap-1.5">
                                <h1
                                    className="truncate text-[22px] font-extrabold leading-tight group-hover:underline"
                                    style={{ color: colors.text }}
                                >
                                    {providerName}
                                </h1>
                                {isVerified ? <VerifiedBadge size={20} /> : null}
                            </div>
                            <p className="text-sm" style={{ color: colors.textLight }}>
                                {providerHandle}
                            </p>
                        </Link>
                        <p
                            className="pt-0.5 text-[15px] font-semibold"
                            style={{ color: colors.text }}
                        >
                            {service.title}
                        </p>
                        {locationText ? (
                            <div
                                className="flex items-center gap-1.5 text-[13px]"
                                style={{ color: colors.textSecondary }}
                            >
                                <MapPin className="h-4 w-4 shrink-0" style={{ color: colors.text }} />
                                <span>{locationText}</span>
                            </div>
                        ) : null}
                        {languages.length > 0 ? (
                            <div
                                className="flex items-center gap-1.5 text-[13px]"
                                style={{ color: colors.textSecondary }}
                            >
                                <MessageCircle
                                    className="h-4 w-4 shrink-0"
                                    style={{ color: colors.text }}
                                />
                                <span>
                                    {SERVICE_DETAIL_LABELS.speaks} {languages.join(", ")}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </section>

                {/* Verification chip — shown only for genuinely verified providers */}
                {isVerified ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium"
                            style={{
                                backgroundColor: colors.backgroundTertiary,
                                color: colors.primary,
                            }}
                        >
                            <ShieldCheck className="h-4 w-4" style={{ color: colors.primary }} />
                            {SERVICE_DETAIL_LABELS.verified}
                        </span>
                    </div>
                ) : null}

                {/* Agency backing section — only for agency-backed workers */}
                {provider?.agency && (
                    <div className="mt-4 flex flex-col gap-3">
                        {/* BACKED BY card */}
                        <div className="rounded-2xl border border-[#C8E6C4] bg-[#EEF8EA] p-4">
                            <div className="mb-3 flex items-center gap-1">
                                <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Backed by
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {provider.agency.logoUrl ? (
                                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow">
                                            <Image
                                                src={provider.agency.logoUrl}
                                                alt={provider.agency.name}
                                                width={48}
                                                height={48}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand shadow">
                                            <span className="text-[16px] font-bold text-white">
                                                {provider.agency.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="truncate text-[14px] font-bold text-ink">
                                                {provider.agency.name}
                                            </span>
                                            {provider.agency.verified && <VerifiedBadge size={14} />}
                                        </div>
                                        {provider.agency._count && (
                                            <p className="text-[11px] text-ink-muted">
                                                {provider.agency._count.workers} Active Workers · {provider.agency._count.placements} Placements
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Link
                                    href={`/organization/${provider.agency.id}`}
                                    className="flex-shrink-0 rounded-lg border border-brand px-3 py-1.5 text-[11px] font-semibold text-brand"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View Profile
                                </Link>
                            </div>
                            {/* Trust badges row */}
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                                {["ID Verified", "Police Checked", "Replacement Guaranteed"].map((badge) => (
                                    <span key={badge} className="flex items-center gap-1 text-[11px] font-medium text-brand">
                                        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Hiring Protection card */}
                        <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: colors.backgroundTertiary }}
                            >
                                <ShieldCheck className="h-5 w-5" style={{ color: colors.primary }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-bold text-ink">Hiring Protection</p>
                                <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                                    If this worker doesn&apos;t work out, {provider.agency.name} guarantees a free replacement within the coverage window.
                                </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <p className="text-[11px] font-bold text-brand">Covered for</p>
                                <p className="text-[13px] font-extrabold text-brand">30 Days</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Price + Availability card */}
                <section
                    className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                >
                    <div className="flex items-start gap-3 p-4">
                        <Coins
                            className="mt-0.5 h-6 w-6 shrink-0"
                            style={{ color: colors.primary }}
                        />
                        <div className="min-w-0">
                            <p
                                className="text-[13px] font-medium"
                                style={{ color: colors.textSecondary }}
                            >
                                {SERVICE_DETAIL_LABELS.priceLabel}
                            </p>
                            <p
                                className="mt-0.5 text-[15px] font-extrabold leading-tight"
                                style={{ color: colors.primary }}
                            >
                                {priceText}
                            </p>
                            <p
                                className="mt-1 text-[11px] leading-snug"
                                style={{ color: colors.textMuted }}
                            >
                                {SERVICE_DETAIL_LABELS.priceCaption}
                            </p>
                        </div>
                    </div>
                    <div
                        className="flex items-start gap-3 p-4"
                        style={{ borderLeft: `1px solid ${colors.border}` }}
                    >
                        <Clock
                            className="mt-0.5 h-6 w-6 shrink-0"
                            style={{ color: colors.primary }}
                        />
                        <div className="min-w-0">
                            <p
                                className="text-[13px] font-medium"
                                style={{ color: colors.textSecondary }}
                            >
                                {SERVICE_DETAIL_LABELS.availabilityLabel}
                            </p>
                            <p
                                className="mt-0.5 text-[15px] font-extrabold leading-tight"
                                style={{ color: colors.primary }}
                            >
                                {SERVICE_DETAIL_LABELS.availabilityValue}
                            </p>
                            <p
                                className="mt-1 text-[11px] leading-snug"
                                style={{ color: colors.textMuted }}
                            >
                                {SERVICE_DETAIL_LABELS.availabilityCaption}
                            </p>
                        </div>
                    </div>
                </section>

                {educationLevel ? (
                    <section
                        className="mt-3 rounded-2xl bg-white p-4"
                        style={{ border: `1px solid ${colors.border}` }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                    backgroundColor: colors.backgroundTertiary,
                                    color: colors.primary,
                                }}
                            >
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-bold" style={{ color: colors.text }}>
                                    Education
                                </h2>
                                <p className="mt-1 text-[13px]" style={{ color: colors.textSecondary }}>
                                    {educationLevel}
                                </p>
                                <p className="mt-1 text-[11px]" style={{ color: colors.textMuted }}>
                                    Shared by {firstName}; no document required.
                                </p>
                            </div>
                        </div>
                    </section>
                ) : null}

                {/* Stats strip */}
                <section
                    className="mt-3 grid grid-cols-4 rounded-2xl bg-white"
                    style={{ border: `1px solid ${colors.border}` }}
                >
                    {PROVIDER_STATS.map((stat, idx) => {
                        const Icon = LUCIDE[stat.icon];
                        return (
                            <div
                                key={stat.key}
                                className="flex flex-col items-center gap-1 px-1 py-3 text-center"
                                style={
                                    idx < PROVIDER_STATS.length - 1
                                        ? { borderRight: `1px solid ${colors.border}` }
                                        : undefined
                                }
                            >
                                {Icon ? (
                                    <Icon
                                        className="h-5 w-5"
                                        style={{ color: colors.text }}
                                    />
                                ) : null}
                                <p
                                    className="text-[15px] font-extrabold leading-none"
                                    style={{ color: colors.text }}
                                >
                                    {statDisplay[stat.key]}
                                </p>
                                <p
                                    className="text-[11px] leading-tight"
                                    style={{ color: colors.textMuted }}
                                >
                                    {stat.label}
                                </p>
                            </div>
                        );
                    })}
                </section>

                {/* About — the provider's own service description */}
                {aboutText ? (
                    <section
                        className="mt-3 rounded-2xl bg-white p-4"
                        style={{ border: `1px solid ${colors.border}` }}
                    >
                        <h2 className="text-[16px] font-bold" style={{ color: colors.text }}>
                            {SERVICE_DETAIL_LABELS.aboutPrefix} {firstName}
                        </h2>
                        <p
                            className={`mt-2 whitespace-pre-line text-[13px] leading-[1.55] ${
                                bioExpanded ? "" : "line-clamp-3"
                            }`}
                            style={{ color: colors.textSecondary }}
                        >
                            {aboutText}
                        </p>
                        <button
                            type="button"
                            onClick={() => setBioExpanded((v) => !v)}
                            className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold"
                            style={{ color: colors.primary }}
                        >
                            {bioExpanded
                                ? SERVICE_DETAIL_LABELS.readLess
                                : SERVICE_DETAIL_LABELS.readMore}
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                    bioExpanded ? "rotate-180" : ""
                                }`}
                            />
                        </button>
                    </section>
                ) : null}

                {/* Services Offered */}
                {servicesOffered.length > 0 ? (
                <section className="mt-5">
                    <h2 className="text-[16px] font-bold" style={{ color: colors.text }}>
                        {SERVICE_DETAIL_LABELS.servicesOffered}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {servicesOffered.map((name) => {
                            const iconKey =
                                SERVICE_CATEGORY_ICONS[name] || DEFAULT_CATEGORY_ICON;
                            const Icon = LUCIDE[iconKey];
                            return (
                                <span
                                    key={name}
                                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium"
                                    style={{
                                        backgroundColor: colors.backgroundTertiary,
                                        color: colors.text,
                                    }}
                                >
                                    {Icon ? (
                                        <Icon
                                            className="h-4 w-4"
                                            style={{ color: colors.primary }}
                                        />
                                    ) : null}
                                    {name}
                                </span>
                            );
                        })}
                    </div>
                </section>
                ) : null}

                {/* Work Photos — horizontal scroll strip; hidden when provider has none */}
                {workPhotos.length > 0 ? (
                <section className="mt-5">
                    <h2 className="text-[16px] font-bold" style={{ color: colors.text }}>
                        {SERVICE_DETAIL_LABELS.workPhotos}
                        <span className="ml-2 text-[13px] font-normal" style={{ color: colors.textMuted }}>
                            ({workPhotos.length})
                        </span>
                    </h2>
                    {/* Negative horizontal margin lets the strip bleed to the screen edge */}
                    <div
                        className="mt-3 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2"
                        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
                    >
                        {workPhotos.map((src, i) => (
                            <button
                                type="button"
                                key={i}
                                onClick={() => openLightbox(workPhotos, i)}
                                aria-label="View photo"
                                className="relative h-40 w-40 flex-shrink-0 snap-start overflow-hidden rounded-xl bg-gray-100"
                            >
                                <Image
                                    src={src}
                                    alt=""
                                    fill
                                    sizes="160px"
                                    className="object-cover"
                                    unoptimized={shouldUnoptimizeImage(src)}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            serviceImageFallback;
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </section>
                ) : null}

                {/* Reviews */}
                <ReviewsBlock serviceId={service.id} providerId={service.provider?.id} />

                {/* Report — only for visitors, not the provider themselves */}
                {!isOwnService && (
                    <div className="mt-6 mb-2 flex justify-center">
                        <button
                            type="button"
                            onClick={() => requireAuth(() => setIsReportOpen(true), "report")}
                            className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Flag className="w-3.5 h-3.5" />
                            Report this service
                        </button>
                    </div>
                )}
            </main>

            {isReportOpen && provider && (
                <ReportModal
                    targetId={provider.id}
                    targetName={providerName}
                    onClose={() => setIsReportOpen(false)}
                />
            )}

            {/* Image lightbox — navigable with arrows, swipe, and keyboard */}
            {lightbox && (() => {
                const { images, index } = lightbox;
                const src = images[index];
                const hasPrev = index > 0;
                const hasNext = index < images.length - 1;
                let touchStartX = 0;
                return (
                    <div
                        role="dialog"
                        aria-modal="true"
                        onClick={closeLightbox}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
                    >
                        {/* Close */}
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={closeLightbox}
                            className="absolute right-4 top-4 z-10 rounded-full bg-white/15 p-2 text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        {/* Prev */}
                        {hasPrev && (
                            <button
                                type="button"
                                aria-label="Previous photo"
                                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        )}

                        {/* Next */}
                        {hasNext && (
                            <button
                                type="button"
                                aria-label="Next photo"
                                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        )}

                        {/* Image — swipe left/right to navigate */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            key={src}
                            src={src}
                            alt=""
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => { touchStartX = e.touches[0].clientX; }}
                            onTouchEnd={(e) => {
                                const dx = e.changedTouches[0].clientX - touchStartX;
                                if (dx > 50) lightboxPrev();
                                else if (dx < -50) lightboxNext();
                            }}
                            style={{ maxHeight: "85dvh", maxWidth: "calc(100vw - 5rem)", width: "auto", height: "auto" }}
                            className="rounded-lg"
                        />

                        {/* Dot indicators */}
                        {images.length > 1 && (
                            <div className="absolute bottom-5 flex gap-2">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        aria-label={`Photo ${i + 1}`}
                                        onClick={(e) => { e.stopPropagation(); setLightbox({ images, index: i }); }}
                                        className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {isInquiryOpen && service?.provider?.agency && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
                    <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-brand uppercase tracking-wider">Contact Agency</p>
                                <h3 className="text-[17px] font-black text-ink mt-0.5">{service.provider.agency.name}</h3>
                                <p className="text-[13px] text-gray-400">About {providerName}</p>
                            </div>
                            <button onClick={() => { setIsInquiryOpen(false); setInquiryNote(""); }} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[12px] leading-relaxed text-gray-500">
                            Send a short note to the agency. They&apos;ll review your request and reach out to discuss before placing a worker with you.
                        </p>
                        <textarea
                            value={inquiryNote}
                            onChange={(e) => setInquiryNote(e.target.value)}
                            rows={4}
                            placeholder="e.g. I'm looking for a full-time nanny in Kicukiro, starting next month."
                            className="w-full rounded-2xl border border-gray-200 p-3 text-[14px] outline-none focus:border-brand resize-none"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsInquiryOpen(false); setInquiryNote(""); }}
                                className="flex-1 h-12 rounded-[18px] border-2 border-gray-100 text-gray-500 font-bold text-[13px] hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInquirySubmit}
                                disabled={inquirySubmitting}
                                className="flex-1 h-12 rounded-[18px] bg-brand text-white font-bold text-[13px] hover:bg-brand-dark shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {inquirySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Inquiry"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isHireModalOpen && service && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
                    <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-brand uppercase tracking-wider">Request to Hire</p>
                                <h3 className="text-[17px] font-black text-ink mt-0.5">{providerName}</h3>
                                <p className="text-[13px] text-gray-400">{service.title}</p>
                            </div>
                            <button onClick={() => { setIsHireModalOpen(false); setHireNotes(""); }} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-ink block mb-1.5">
                                Message <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={hireNotes}
                                onChange={(e) => setHireNotes(e.target.value)}
                                placeholder="Describe what you need, preferred schedule, or any specific requirements…"
                                rows={3}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsHireModalOpen(false); setHireNotes(""); }}
                                className="flex-1 h-12 rounded-[18px] border-2 border-gray-100 text-gray-500 font-bold text-[13px] hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleHireSubmit}
                                disabled={submitting}
                                className="flex-1 h-12 rounded-[18px] bg-brand text-white font-bold text-[13px] hover:bg-brand-dark shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky bottom action bar — constrained to phone container */}
            <div
                className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-[428px] bg-white px-4 py-3"
                style={{ borderTop: `1px solid ${colors.border}` }}
            >
                {isOwnService ? (
                    <button
                        type="button"
                        onClick={() => router.push(`/more/services/${serviceId}/edit`)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white"
                        style={{ backgroundColor: colors.primary }}
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Service
                    </button>
                ) : provider?.agency ? (
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/organization/${provider.agency.id}`}
                            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-bold"
                            style={{
                                border: `1.5px solid ${colors.primary}`,
                                color: colors.primary,
                            }}
                        >
                            View Agency
                        </Link>
                        <button
                            onClick={() => requireAuth(() => setIsInquiryOpen(true), "hire")}
                            disabled={inquirySent}
                            className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white disabled:opacity-70"
                            style={{ backgroundColor: inquirySent ? "#9CA3AF" : colors.primary }}
                        >
                            {inquirySent ? "Inquiry Sent" : "Contact Agency"}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => requireAuth(() => router.push(messageHref), "message")}
                            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-bold"
                            style={{
                                border: `1.5px solid ${colors.primary}`,
                                color: colors.primary,
                            }}
                        >
                            <MessageCircle className="h-5 w-5" />
                            {SERVICE_DETAIL_LABELS.message}
                        </button>
                        <button
                            onClick={() => requireAuth(openHireModal, "hire")}
                            disabled={submitting || hasRequested}
                            className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white disabled:opacity-70"
                            style={{ backgroundColor: hasRequested ? "#9CA3AF" : colors.primary }}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : hasRequested ? (
                                SERVICE_DETAIL_LABELS.requestSent
                            ) : (
                                SERVICE_DETAIL_LABELS.requestToHire
                            )}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}

export default ServiceDetailPage;

/**
 * Reviews block — replicates the "Reviews (N)" header + See all layout
 * from the design. Uses the same API the existing ReviewSection
 * uses, but renders only the first review inline to match the screenshot.
 */
function ReviewsBlock({ serviceId, providerId }: { serviceId: string; providerId?: string }) {
    const searchParams = useSearchParams();
    const focusedReviewId = searchParams.get("reviewId");
    const { reviews, totalReviews, loading, replyToReview } = useReviews({ serviceId });
    const providerReviews = providerId
        ? reviews.filter((review) => review.target?.id === providerId)
        : reviews;
    const focusedReview = focusedReviewId
        ? providerReviews.find((review) => review.id === focusedReviewId)
        : undefined;
    const first = focusedReview || providerReviews[0];

    return (
        <section id="reviews" className="mt-5 scroll-mt-24">
            <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold" style={{ color: colors.text }}>
                    {SERVICE_DETAIL_LABELS.reviews} ({providerReviews.length})
                </h2>
                <button
                    type="button"
                    className="text-[13px] font-semibold"
                    style={{ color: colors.primary }}
                >
                    {SERVICE_DETAIL_LABELS.seeAll}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2
                        className="h-5 w-5 animate-spin"
                        style={{ color: colors.primary }}
                    />
                </div>
            ) : first ? (
                <div
                    id={`review-${first.id}`}
                    className="mt-3 rounded-2xl bg-white p-4"
                    style={{ border: `1px solid ${colors.border}` }}
                >
                    <ReviewCard review={first} onReply={replyToReview} />
                </div>
            ) : (
                <p className="mt-3 text-[13px]" style={{ color: colors.textMuted }}>
                    {SERVICE_DETAIL_LABELS.noReviewsYet}
                </p>
            )}
        </section>
    );
}
