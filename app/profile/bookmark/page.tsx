"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import BackButtonHeader from "@/components/header/back-button-header";
import { RootState } from "@/store";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import ServiceCard from "@/components/service-card";
import { Service } from "@/types";

interface BookmarksResponse {
    service: Service;
}

const BookmarksPage = () => {
    const [bookmarkedServices, setBookmarkedServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const router = useRouter();

    useEffect(() => {
        const fetchBookmarks = async () => {
            setIsLoading(true);
            try {
                const response = await api.get("/bookmarks/services", { withCredentials: true });
                const bookmarks: BookmarksResponse[] = Array.isArray(response.data.data)
                    ? response.data.data
                    : [];
                // Extract the `service` property from each BookmarksResponse
                const services: Service[] = bookmarks.map((bookmark) => bookmark.service);
                
                setBookmarkedServices(services);
            } catch (error) {
                console.error("Failed to fetch bookmarks:", error);
                setBookmarkedServices([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchBookmarks();
        } else {
            setBookmarkedServices([]);
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    return (
        <div className="p-6">
            <BackButtonHeader text="Bookmarks" backHref="/profile" />
            <div className="mt-4 space-y-4">
                {isLoading ? (
                    <p className="text-center text-gray-500">Loading bookmarks...</p>
                ) : bookmarkedServices.length > 0 ? (
                    bookmarkedServices.map((service) => (
                        <ServiceCard
                            key={service.id}
                            id={service.id}
                            image={service?.serviceImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800"}
                            name={`${service?.provider?.firstName || "Unknown"} ${service?.provider?.lastName || "Provider"}`}
                            title={service?.title || "Untitled Service"}
                            experience="5+ years" 
                            languages={Array.isArray(service?.worker?.languages) ? service.worker.languages.join(", ") : "N/A"}
                            location={Array.isArray(service?.serviceAreas) ? service.serviceAreas.join(", ") : service?.serviceAreas || "N/A"}
                            price={`${service?.price || 0} RWF/day`}
                            rating={service?.reviews?.averageRating || 0}
                            reviews={service?.reviews?.totalReviews || 0}
                            distance="2.5 miles" 
                            available={true} 
                            verified={service?.provider?.userType === "AGENCY"}
                            onClick={() => router.push(`/book/${service?.provider?.userType}/${service.id}`)}
                        />
                    ))
                ) : (
                    <p className="text-center text-gray-500">No bookmarked services found.</p>
                )}
            </div>
        </div>
    );
};

export default BookmarksPage;