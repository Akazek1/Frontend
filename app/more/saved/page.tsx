"use client";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BackButtonHeader from "@/components/header/back-button-header";
import { RootState } from "@/store";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import ServiceCard from "@/components/service-card";
import { Service } from "@/types";
import { useBookmark } from "@/context/bookmark-context";
import { formatPrice } from "@/lib/utils";
import { getBookingType, getProviderHandle, getServiceCardImage, getServiceDetailPath } from "@/lib/service-display";
import { isEmployer } from "@/lib/roles";
import { Bookmark, Search } from "lucide-react";
import {
    PageShell,
    EmptyState,
    appContentClass,
    appPrimaryButtonClass,
} from "@/components/ui/app-primitives";

interface BookmarksResponse {
    service: Service;
}

const BOOKMARKS_KEY = ["bookmarks", "services"] as const;

const BookmarksPage = () => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toggleBookmark, isBookmarked } = useBookmark("services"); // Use the bookmark context

    // Cached: returning to this page renders saved cards instantly, no spinner.
    const { data: bookmarkedServices = [], isLoading } = useQuery({
        queryKey: BOOKMARKS_KEY,
        enabled: isAuthenticated,
        queryFn: async () => {
            const response = await api.get("/bookmarks/services", { withCredentials: true });
            const bookmarks: BookmarksResponse[] = Array.isArray(response.data.data)
                ? response.data.data
                : [];
            return bookmarks.map((bookmark) => bookmark.service);
        },
    });

    const handleRemoveBookmark = async (serviceId: string) => {
        if (isBookmarked(serviceId)) {
            await toggleBookmark(serviceId); // Use context to remove bookmark
            // Optimistically drop it from the cached list.
            queryClient.setQueryData<Service[]>(BOOKMARKS_KEY, (prev) =>
                (prev ?? []).filter((service) => service.id !== serviceId),
            );
        }
    };

    return (
        <PageShell className="gap-5">
            <BackButtonHeader text="Bookmarks" backHref="/more" />
            <div className={appContentClass}>
                {isLoading ? (
                    <div className="rounded-2xl border border-[#DCE8D9] bg-white p-6 text-center text-[13px] text-[#5F6773] shadow-sm">
                        Loading bookmarks...
                    </div>
                ) : bookmarkedServices.length > 0 ? (
                    bookmarkedServices.map((service) => (
                        <ServiceCard
                            key={service.id}
                            id={service.id}
                            image={getServiceCardImage(service)}
                            profileImage={service?.provider?.profilePicture}
                            name={`${service?.provider?.firstName || "Unknown"} ${service?.provider?.lastName || "Provider"}`}
                            handle={getProviderHandle(service.provider)}
                            title={service?.title || "Untitled Service"}
                            experience="5+ years"
                            languages={Array.isArray(service?.worker?.languages) ? service.worker.languages.join(", ") : "N/A"}
                            location={Array.isArray(service?.serviceAreas) ? service.serviceAreas.join(", ") : service?.serviceAreas || "N/A"}
                            price={formatPrice(service?.priceMin, service?.priceMax, service?.priceType)}
                            rating={service?.reviews?.averageRating || 0}
                            reviews={service?.reviews?.totalReviews || 0}
                            distance="2.5 miles"
                            available={true}
                            verified={isEmployer(service?.provider?.roles)}
                            onClick={() => router.push(getServiceDetailPath(service))}
                            onHireClick={() => router.push(`/book/${getBookingType(service)}/${service.id}`)}
                            onRemoveBookmark={() => handleRemoveBookmark(service.id)} 
                            isBookmarked={isBookmarked(service.id)} // Pass bookmark status
                        />
                    ))
                ) : (
                    <EmptyState
                        icon={Bookmark}
                        title="No saved services yet"
                        description="Bookmark providers you like so you can compare them later and book faster when you are ready."
                        action={
                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className={`${appPrimaryButtonClass} flex w-full items-center justify-center gap-2`}
                            >
                                <Search className="h-4 w-4" />
                                Browse providers
                            </button>
                        }
                    />
                )}
            </div>
        </PageShell>
    );
};

export default BookmarksPage;
