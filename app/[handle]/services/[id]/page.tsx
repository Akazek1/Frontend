"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bookmark,
    Briefcase,
    ChevronDown,
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
    Sparkles,
    Star,
    UtensilsCrossed,
    Users,
} from "lucide-react";

import api from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
    getBookingType,
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
    SERVICE_DETAIL_FALLBACKS,
    SERVICE_DETAIL_LABELS,
    WORK_PHOTOS_VISIBLE,
} from "@/constant/service-detail";
import { Service } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ReportModal } from "@/components/provider/report-modal";
import toast from "react-hot-toast";

const LUCIDE: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Briefcase,
    ClipboardCheck,
    Clock,
    Users,
    Home: HomeIcon,
    Sparkles,
    UtensilsCrossed,
    Shirt,
    PanelTop,
};

function formatStatValue(value: number, suffix?: string, plusOnGte?: number) {
    const display = `${value}${suffix ?? ""}`;
    if (plusOnGte !== undefined && value >= plusOnGte) return `${display}+`;
    return display;
}

function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = params.id as string;
    const { user } = useAuth();
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
            } catch (err: unknown) {
                const message = (err as { response?: { data?: { message?: string } } })?.response
                    ?.data?.message;
                setError(message || SERVICE_DETAIL_LABELS.serviceNotFound);
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
                const res = await api.get("/bookings");
                const bookings = Array.isArray(res.data?.data)
                    ? res.data.data
                    : Array.isArray(res.data)
                    ? res.data
                    : [];
                const inactive = new Set(["CANCELLED", "REJECTED"]);
                const found = bookings.some(
                    (b: any) =>
                        b?.service?.id === serviceId &&
                        !inactive.has(String(b.status).toUpperCase())
                );
                setHasRequested(found);
            } catch {
                // silent
            }
        };
        fetchExisting();
    }, [serviceId]);

    const provider = service?.provider;
    const providerName = useMemo(() => getProviderName(provider), [provider]);
    const providerHandle = useMemo(() => getProviderHandle(provider), [provider]);
    const profilePath = `/${providerHandle.replace(/^@/, "")}`;
    const firstName = provider?.firstName || providerName.split(" ")[0] || "Provider";

    const serviceImages = useMemo(() => getServiceImages(service), [service]);
    const workPhotos = serviceImages;
    const workPhotosTotal =
        workPhotos.length > 0 ? workPhotos.length : SERVICE_DETAIL_FALLBACKS.workPhotosTotal;

    const providerPhoto =
        provider?.profilePicture || provider?.profileImg || profileImageFallback;

    const languages =
        provider?.languages && provider.languages.length > 0
            ? provider.languages
            : SERVICE_DETAIL_FALLBACKS.languages;

    const idVerified = provider?.isVerified ?? SERVICE_DETAIL_FALLBACKS.idVerified;
    const backgroundChecked = SERVICE_DETAIL_FALLBACKS.backgroundChecked;
    const availableToday = service?.isActive ?? SERVICE_DETAIL_FALLBACKS.availableToday;

    const bio = provider?.bio || SERVICE_DETAIL_FALLBACKS.bio;

    const priceText = useMemo(() => {
        if (!service) return SERVICE_DETAIL_FALLBACKS.priceRangeText;
        const f = formatPrice(service.priceMin, service.priceMax, service.priceType);
        return f && f !== "Price on request" ? f : SERVICE_DETAIL_FALLBACKS.priceRangeText;
    }, [service]);

    const statValues: Record<string, number> = {
        years: SERVICE_DETAIL_FALLBACKS.yearsExperience,
        jobs: SERVICE_DETAIL_FALLBACKS.jobsCompleted,
        onTime: SERVICE_DETAIL_FALLBACKS.onTimeRate,
        clients: SERVICE_DETAIL_FALLBACKS.happyClients,
    };

    const servicesOffered = useMemo(() => {
        const derived = providerServices
            .map((s) => (typeof s.category === "string" ? s.category : s.category?.name))
            .filter((v): v is string => Boolean(v));
        const unique = Array.from(new Set(derived));
        return unique.length > 0 ? unique : SERVICE_DETAIL_FALLBACKS.servicesOffered;
    }, [providerServices]);

    const distanceText = SERVICE_DETAIL_FALLBACKS.distanceText;
    const city = SERVICE_DETAIL_FALLBACKS.city;

    const messageHref = "/conversations";

    const isOwnService = Boolean(
        user?.id && service && (service.providerId === user.id || service.provider?.id === user.id)
    );

    const handleHireRequest = async () => {
        if (!service || submitting || hasRequested) return;
        if (isOwnService) {
            const { toast } = await import("react-hot-toast");
            toast.error("You can't book your own service.");
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/bookings", { serviceId: service.id });
            const { toast } = await import("react-hot-toast");
            toast.success(`Booking request sent to ${firstName}!`);
            setHasRequested(true);
        } catch (err: any) {
            const { toast } = await import("react-hot-toast");
            toast.error(err?.response?.data?.message || "Failed to send request.");
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
        <div className="min-h-screen pb-28" style={{ backgroundColor: "#FFFFFF" }}>
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
                </div>
            </div>

            <main className="mx-auto max-w-md px-4 pt-2">
                {/* Profile header */}
                <section className="flex items-start gap-4">
                    {/* Avatar with Available Today pill */}
                    <div className="relative shrink-0">
                        <Link
                            href={profilePath}
                            aria-label={`View ${providerName}'s profile`}
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
                        </Link>
                        {availableToday ? (
                            <div
                                className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 py-1 shadow-sm"
                                style={{ border: `1px solid ${colors.border}` }}
                            >
                                <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: "#22C55E" }}
                                />
                                <span
                                    className="text-[11px] font-semibold"
                                    style={{ color: colors.text }}
                                >
                                    {SERVICE_DETAIL_LABELS.availableToday}
                                </span>
                            </div>
                        ) : null}
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
                                {idVerified ? <VerifiedBadge size={20} /> : null}
                            </div>
                            <p className="text-sm" style={{ color: colors.textLight }}>
                                {providerHandle}
                            </p>
                        </Link>
                        <p
                            className="pt-0.5 text-[15px] font-semibold"
                            style={{ color: colors.text }}
                        >
                            {service.title || "Professional House Cleaning"}
                        </p>
                        <div
                            className="flex items-center gap-1.5 text-[13px]"
                            style={{ color: colors.textSecondary }}
                        >
                            <MapPin className="h-4 w-4 shrink-0" style={{ color: colors.text }} />
                            <span>
                                {city} • {distanceText}
                            </span>
                        </div>
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
                    </div>
                </section>

                {/* Verification chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {idVerified ? (
                        <span
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium"
                            style={{
                                backgroundColor: colors.backgroundTertiary,
                                color: colors.primary,
                            }}
                        >
                            <ShieldCheck className="h-4 w-4" style={{ color: colors.primary }} />
                            {SERVICE_DETAIL_LABELS.idVerified}
                        </span>
                    ) : null}
                    {backgroundChecked ? (
                        <span
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium"
                            style={{
                                backgroundColor: colors.backgroundTertiary,
                                color: colors.primary,
                            }}
                        >
                            <ShieldCheck className="h-4 w-4" style={{ color: colors.primary }} />
                            {SERVICE_DETAIL_LABELS.backgroundChecked}
                        </span>
                    ) : null}
                </div>

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

                {/* Stats strip */}
                <section
                    className="mt-3 grid grid-cols-4 rounded-2xl bg-white"
                    style={{ border: `1px solid ${colors.border}` }}
                >
                    {PROVIDER_STATS.map((stat, idx) => {
                        const Icon = LUCIDE[stat.icon];
                        const value = statValues[stat.key] ?? 0;
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
                                    {formatStatValue(value, stat.suffix, stat.plusOnGte)}
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

                {/* About */}
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
                        {bio}
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

                {/* Services Offered */}
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

                {/* Work Photos */}
                <section className="mt-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[16px] font-bold" style={{ color: colors.text }}>
                            {SERVICE_DETAIL_LABELS.workPhotos}
                        </h2>
                        <button
                            type="button"
                            className="text-[13px] font-semibold"
                            style={{ color: colors.primary }}
                        >
                            {SERVICE_DETAIL_LABELS.viewAll}
                        </button>
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-2">
                        {Array.from({ length: WORK_PHOTOS_VISIBLE }).map((_, i) => {
                            const src = workPhotos[i] || serviceImageFallback;
                            const isLast = i === WORK_PHOTOS_VISIBLE - 1;
                            const extra = Math.max(0, workPhotosTotal - WORK_PHOTOS_VISIBLE);
                            return (
                                <div
                                    key={i}
                                    className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                                >
                                    <Image
                                        src={src}
                                        alt=""
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                        unoptimized={shouldUnoptimizeImage(src)}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                serviceImageFallback;
                                        }}
                                    />
                                    {isLast && extra > 0 ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white">
                                            +{extra}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Reviews */}
                <ReviewsBlock serviceId={service.id} />

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

            {/* Sticky bottom action bar — constrained to phone container */}
            <div
                className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-[428px] bg-white px-4 py-3"
                style={{ borderTop: `1px solid ${colors.border}` }}
            >
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
                        onClick={() => requireAuth(handleHireRequest, "hire")}
                        disabled={submitting || hasRequested || isOwnService}
                        className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white disabled:opacity-70"
                        style={{ backgroundColor: isOwnService || hasRequested ? "#9CA3AF" : colors.primary }}
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isOwnService ? (
                            "Your service"
                        ) : hasRequested ? (
                            SERVICE_DETAIL_LABELS.requestSent
                        ) : (
                            SERVICE_DETAIL_LABELS.requestToHire
                        )}
                    </button>
                </div>
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
function ReviewsBlock({ serviceId }: { serviceId: string }) {
    type ReviewItem = {
        id: string;
        rating: number;
        comment: string;
        user: { firstName: string; lastName: string; profilePicture?: string };
        booking: { updatedAt: string };
    };
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const res = await api.get(`/reviews?serviceId=${serviceId}`);
                const data = res.data?.data || res.data || {};
                const list: ReviewItem[] = Array.isArray(data.reviews)
                    ? data.reviews
                    : Array.isArray(data)
                      ? data
                      : [];
                if (active) {
                    setReviews(list);
                    setTotal(typeof data.totalReviews === "number" ? data.totalReviews : list.length);
                }
            } catch {
                if (active) {
                    setReviews([]);
                    setTotal(0);
                }
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [serviceId]);

    const first = reviews[0];

    return (
        <section className="mt-5">
            <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold" style={{ color: colors.text }}>
                    {SERVICE_DETAIL_LABELS.reviews} ({total})
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
                    className="mt-3 rounded-2xl bg-white p-4"
                    style={{ border: `1px solid ${colors.border}` }}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
                            style={{
                                backgroundColor: colors.backgroundTertiary,
                                color: colors.primary,
                            }}
                        >
                            {(first.user?.firstName || "?").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p
                                className="text-[14px] font-bold"
                                style={{ color: colors.text }}
                            >
                                {first.user?.firstName} {first.user?.lastName?.charAt(0)}.
                            </p>
                            <p
                                className="text-[12px]"
                                style={{ color: colors.textLight }}
                            >
                                {first.booking?.updatedAt
                                    ? new Date(first.booking.updatedAt).toLocaleDateString(
                                          "en-US",
                                          { year: "numeric", month: "short", day: "numeric" },
                                      )
                                    : ""}
                            </p>
                            <div className="mt-1.5 flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        className="h-4 w-4"
                                        style={{
                                            fill:
                                                s <= first.rating
                                                    ? "#FACC15"
                                                    : "transparent",
                                            stroke: "#FACC15",
                                        }}
                                    />
                                ))}
                            </div>
                            <p
                                className="mt-2 text-[13px] leading-snug"
                                style={{ color: colors.textSecondary }}
                            >
                                {first.comment}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="mt-3 text-[13px]" style={{ color: colors.textMuted }}>
                    {SERVICE_DETAIL_LABELS.noReviewsYet}
                </p>
            )}
        </section>
    );
}
