"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    BadgeCheck,
    Briefcase,
    CalendarDays,
    Clock,
    Loader2,
    MapPin,
    MessageCircle,
    Navigation,
    Phone,
    ShieldCheck,
    Star,
} from "lucide-react";
import BackButtonHeader from "@/components/header/back-button-header";
import ReviewSection from "@/components/review-section";
import api from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import { colors } from "@/constant/colors";
import APP_CONFIG from "@/constant/app.config";
import { Service } from "@/types";
import {
    getBookingType,
    getProviderHandle,
    getProviderName,
    getServiceCardImage,
    getServiceImages,
    profileImageFallback,
    serviceImageFallback,
    shouldUnoptimizeImage,
} from "@/lib/service-display";

function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = params.id as string;
    const [service, setService] = useState<Service | null>(null);
    const [providerServices, setProviderServices] = useState<Service[]>([]);
    const [activeImage, setActiveImage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchService() {
            if (!serviceId) return;

            setLoading(true);
            setError(null);

            try {
                const serviceResponse = await api.get(`/services/${serviceId}`);
                const nextService =
                    serviceResponse.data?.data || serviceResponse.data;
                setService(nextService);

                const providerId =
                    nextService?.provider?.id || nextService?.providerId;
                if (providerId) {
                    const servicesResponse = await api.get(
                        `/services?providerId=${providerId}`,
                    );
                    const data = Array.isArray(servicesResponse.data?.data)
                        ? servicesResponse.data.data
                        : servicesResponse.data?.data?.data || [];
                    setProviderServices(data);
                }
            } catch (err: unknown) {
                const message = (
                    err as { response?: { data?: { message?: string } } }
                )?.response?.data?.message;
                setError(message || "Service not found");
            } finally {
                setLoading(false);
            }
        }

        fetchService();
    }, [serviceId]);

    const images = useMemo(() => {
        const serviceImages = getServiceImages(service);
        if (serviceImages.length > 0) return serviceImages;
        const providerPhoto =
            service?.provider?.profilePicture || service?.provider?.profileImg;
        if (providerPhoto) return [providerPhoto];
        return [];
    }, [service]);

    if (loading) {
        return (
            <div
                className="flex min-h-screen items-center justify-center"
                style={{ backgroundColor: colors.background }}
            >
                <Loader2
                    className="h-6 w-6 animate-spin"
                    style={{ color: colors.primary }}
                />
            </div>
        );
    }

    if (error || !service) {
        return (
            <div
                className="min-h-screen p-4"
                style={{ backgroundColor: colors.background }}
            >
                <BackButtonHeader text="Service Details" backHref="/" />
                <div className="mt-6 rounded-lg bg-white p-6 text-center text-sm text-red-500">
                    {error || "Service not found"}
                </div>
            </div>
        );
    }

    const provider = service.provider;
    const providerName = getProviderName(provider);
    const price = formatPrice(
        service.priceMin,
        service.priceMax,
        service.priceType,
    );
    const otherServices = providerServices.filter(
        (item) => item.id !== service.id,
    );
    const activeImageSrc = images[activeImage] || "";
    const areas = Array.isArray(service.serviceAreas)
        ? service.serviceAreas
        : [];
    const rating = service.reviews?.averageRating || 0;
    const reviewCount = service.reviews?.totalReviews || 0;
    const providerProfileHref = provider?.username
        ? `/provider/${provider.username}`
        : `/provider/${provider?.id}`;
    const bookingType = getBookingType(service);
    const providerHandle = getProviderHandle(provider);
    const providerPhoto =
        provider?.profilePicture ||
        provider?.profileImg ||
        profileImageFallback;
    const availabilityCount = Array.isArray(service.availability)
        ? service.availability.length
        : 0;
    const availabilityText =
        availabilityCount > 0
            ? `${availabilityCount} available day${availabilityCount !== 1 ? "s" : ""}`
            : APP_CONFIG.serviceDetail.fallbackAvailabilityText;

    return (
        <div
            className="min-h-screen pb-44"
            style={{ backgroundColor: colors.background }}
        >
            <div
                className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur"
                style={{ borderColor: colors.border }}
            >
                <BackButtonHeader text="Service Details" backHref="/" />
            </div>

            <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
                <section
                    className="overflow-hidden rounded-lg bg-white shadow-sm"
                    style={{ border: `1px solid ${colors.border}` }}
                >
                    <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span
                                        className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                                        style={{
                                            backgroundColor: service.isActive
                                                ? colors.primary
                                                : colors.borderMuted,
                                        }}
                                    >
                                        {service.isActive
                                            ? "Available"
                                            : "Unavailable"}
                                    </span>
                                    {rating > 0 ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-bold text-gray-900">
                                            <Star className="h-3.5 w-3.5 fill-yellow-400 stroke-yellow-400" />
                                            {rating.toFixed(1)}
                                            {reviewCount > 0 ? (
                                                <span className="font-medium text-gray-500">
                                                    ({reviewCount})
                                                </span>
                                            ) : null}
                                        </span>
                                    ) : (
                                        <span
                                            className="rounded-full px-2.5 py-1 text-xs font-bold"
                                            style={{
                                                backgroundColor:
                                                    colors.backgroundTertiary,
                                                color: colors.textMuted,
                                            }}
                                        >
                                            New
                                        </span>
                                    )}
                                </div>
                                <h1
                                    className="text-xl font-bold capitalize leading-tight"
                                    style={{ color: colors.text }}
                                >
                                    {service.title}
                                </h1>
                                <p
                                    className="mt-1 text-lg font-bold"
                                    style={{ color: colors.primary }}
                                >
                                    {price}
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="relative aspect-[16/10] w-full bg-gray-100">
                        {activeImageSrc ? (
                            <Image
                                src={activeImageSrc}
                                alt={service.title}
                                fill
                                priority
                                sizes="(max-width: 768px) 100vw, 768px"
                                unoptimized={shouldUnoptimizeImage(
                                    activeImageSrc,
                                )}
                                className="object-cover object-top"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        serviceImageFallback;
                                }}
                            />
                        ) : (
                            <div className="h-full w-full animate-pulse bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100" />
                        )}
                    </div>

                    {images.length > 1 ? (
                        <div className="flex gap-2 overflow-x-auto px-3 py-3">
                            {images.map((image, index) => (
                                <button
                                    key={image}
                                    type="button"
                                    onClick={() => setActiveImage(index)}
                                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2"
                                    style={{
                                        borderColor:
                                            index === activeImage
                                                ? colors.primary
                                                : colors.border,
                                    }}
                                    aria-label={`View service photo ${index + 1}`}
                                >
                                    <Image
                                        src={image}
                                        alt=""
                                        fill
                                        sizes="64px"
                                        className="object-cover object-top"
                                        unoptimized={shouldUnoptimizeImage(
                                            image,
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    ) : null}

                    <div className="space-y-4 p-4">
                        {service.description ? (
                            <div>
                                <h2
                                    className="text-sm font-bold"
                                    style={{ color: colors.text }}
                                >
                                    About this service
                                </h2>
                                <p
                                    className="mt-1 whitespace-pre-line text-sm leading-6"
                                    style={{ color: colors.textSecondary }}
                                >
                                    {service.description}
                                </p>
                            </div>
                        ) : null}

                        <div className="grid gap-2 text-sm">
                            {areas.length > 0 ? (
                                <div
                                    className="flex items-start gap-2 rounded-md p-3"
                                    style={{
                                        backgroundColor:
                                            colors.backgroundSecondary,
                                    }}
                                >
                                    <MapPin
                                        className="mt-0.5 h-4 w-4 shrink-0"
                                        style={{ color: colors.primary }}
                                    />
                                    <span
                                        style={{ color: colors.textSecondary }}
                                    >
                                        {areas.join(", ")}
                                    </span>
                                </div>
                            ) : null}
                            <div
                                className="flex items-start gap-2 rounded-md p-3"
                                style={{
                                    backgroundColor: colors.backgroundSecondary,
                                }}
                            >
                                <Navigation
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    style={{ color: colors.primary }}
                                />
                                <span style={{ color: colors.textSecondary }}>
                                    {APP_CONFIG.serviceDetail.fallbackDistance}
                                </span>
                            </div>
                            <div
                                className="flex items-start gap-2 rounded-md p-3"
                                style={{
                                    backgroundColor: colors.backgroundSecondary,
                                }}
                            >
                                <Clock
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    style={{ color: colors.primary }}
                                />
                                <span style={{ color: colors.textSecondary }}>
                                    {availabilityText}
                                </span>
                            </div>
                            <div
                                className="flex items-start gap-2 rounded-md p-3"
                                style={{
                                    backgroundColor: colors.backgroundSecondary,
                                }}
                            >
                                <CalendarDays
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    style={{ color: colors.primary }}
                                />
                                <span style={{ color: colors.textSecondary }}>
                                    Schedule and exact scope are confirmed
                                    during booking.
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    className="rounded-lg bg-white p-4 shadow-sm"
                    style={{ border: `1px solid ${colors.border}` }}
                >
                    <div className="flex items-start gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <Image
                                src={providerPhoto}
                                alt={providerName}
                                fill
                                sizes="64px"
                                className="object-cover object-top"
                                unoptimized={shouldUnoptimizeImage(
                                    providerPhoto,
                                )}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <h2
                                    className="truncate text-base font-bold"
                                    style={{ color: colors.text }}
                                >
                                    {providerName}
                                </h2>
                                {provider?.isVerified ? (
                                    <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-500 stroke-white" />
                                ) : null}
                            </div>
                            <p
                                className="mt-1 text-xs"
                                style={{ color: colors.textMuted }}
                            >
                                {providerHandle}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {provider?.trustScore ? (
                                    <span
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                                        style={{
                                            backgroundColor:
                                                colors.backgroundTertiary,
                                            color: colors.primary,
                                        }}
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Trust {provider.trustScore.toFixed(1)}
                                    </span>
                                ) : null}
                                <span
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                                    style={{
                                        backgroundColor:
                                            colors.backgroundTertiary,
                                        color: colors.primary,
                                    }}
                                >
                                    <Briefcase className="h-3.5 w-3.5" />
                                    {providerServices.length || 1} service
                                    {(providerServices.length || 1) !== 1
                                        ? "s"
                                        : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    {provider?.bio ? (
                        <p
                            className="mt-3 line-clamp-4 text-sm leading-6"
                            style={{ color: colors.textSecondary }}
                        >
                            {provider.bio}
                        </p>
                    ) : null}
                </section>

                <section
                    className="rounded-lg bg-white p-4 shadow-sm"
                    style={{ border: `1px solid ${colors.border}` }}
                >
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h2
                                className="text-base font-bold"
                                style={{ color: colors.text }}
                            >
                                Reviews from employers
                            </h2>
                            <p
                                className="text-xs"
                                style={{ color: colors.textMuted }}
                            >
                                Feedback for this service after completed
                                bookings
                            </p>
                        </div>
                        {rating > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-bold text-gray-900">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 stroke-yellow-400" />
                                {rating.toFixed(1)}
                            </span>
                        ) : null}
                    </div>
                    <ReviewSection serviceId={service.id} />
                </section>

                {otherServices.length > 0 ? (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2
                                className="text-base font-bold"
                                style={{ color: colors.text }}
                            >
                                More from this provider
                            </h2>
                            <Link
                                href={providerProfileHref}
                                className="text-xs font-bold"
                                style={{ color: colors.primary }}
                            >
                                See all
                            </Link>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {otherServices.map((item) => {
                                const image = getServiceCardImage(item);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            router.push(`/service/${item.id}`)
                                        }
                                        className="w-44 shrink-0 overflow-hidden rounded-lg bg-white text-left shadow-sm"
                                        style={{
                                            border: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        <div className="relative h-28 w-full bg-gray-100">
                                            {image ? (
                                                <Image
                                                    src={image}
                                                    alt={item.title}
                                                    fill
                                                    sizes="176px"
                                                    className="object-cover object-top"
                                                    unoptimized={shouldUnoptimizeImage(
                                                        image,
                                                    )}
                                                />
                                            ) : (
                                                <div className="h-full w-full animate-pulse bg-gray-200" />
                                            )}
                                        </div>
                                        <div className="space-y-1 p-3">
                                            <p
                                                className="line-clamp-2 text-sm font-bold capitalize leading-5"
                                                style={{ color: colors.text }}
                                            >
                                                {item.title}
                                            </p>
                                            <p
                                                className="truncate text-[11px]"
                                                style={{
                                                    color: colors.textMuted,
                                                }}
                                            >
                                                {getProviderHandle(
                                                    item.provider,
                                                )}
                                            </p>
                                            <p
                                                className="text-xs font-semibold"
                                                style={{
                                                    color: colors.primary,
                                                }}
                                            >
                                                {formatPrice(
                                                    item.priceMin,
                                                    item.priceMax,
                                                    item.priceType,
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ) : null}
            </main>
        </div>
    );
}

export default ServiceDetailPage;
