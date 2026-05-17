"use client";
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import ServiceCard from "@/components/service-card";
import { useRouter, useSearchParams } from "next/navigation";
import { Service } from "@/types";
import BackButtonHeader from "@/components/header/back-button-header";
import { formatPrice } from "@/lib/utils";
import { getBookingType, getProviderHandle, getServiceCardImage, getServiceDetailPath } from "@/lib/service-display";
import { isEmployer } from "@/lib/roles";
import { Icons } from "@/components/icons";
import FilterModal, { FilterValues } from "@/components/search/filter-modal";


const ServicePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get("category");
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const [filters, setFilters] = useState<FilterValues>({
        minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
        maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
        serviceType: searchParams.get("serviceType") || undefined,
        minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
    });

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (category && category !== "all") params.append("category", category);
            if (searchTerm) params.append("searchTerm", searchTerm);
            if (filters.minPrice) params.append("minPrice", filters.minPrice.toString());
            if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
            if (filters.serviceType) params.append("serviceType", filters.serviceType);
            if (filters.minRating) params.append("minRating", filters.minRating.toString());

            const response = await api.get(`/services?${params.toString()}`);
            
            if (response.status !== 200) {
                throw new Error("Failed to fetch services");
            }
            const data: Service[] = await response.data.data;
            setServices(data);
        } catch {
            setError("Something went wrong while fetching services.");
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    }, [category, searchTerm, filters]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleApplyFilters = (newFilters: FilterValues) => {
        setFilters(newFilters);
        // Update URL to reflect current search/filter state
        const params = new URLSearchParams(searchParams.toString());
        if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice.toString()); else params.delete("minPrice");
        if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice.toString()); else params.delete("maxPrice");
        if (newFilters.serviceType) params.set("serviceType", newFilters.serviceType); else params.delete("serviceType");
        if (newFilters.minRating) params.set("minRating", newFilters.minRating.toString()); else params.delete("minRating");
        router.push(`/service?${params.toString()}`);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header with Back Arrow */}
            <BackButtonHeader text={category || "Services"} backHref="/" />

            {/* Search Bar & Filter Button */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Icons.SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 fill-[#878787]" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl placeholder:text-sm placeholder:text-[#878787] focus:outline-none focus:ring-2 focus:ring-[#145B10]/20 shadow-sm"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <Icons.FilerIcon className="w-5 h-5 fill-[#145B10]" />
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#145B10]/20 border-t-[#145B10] rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm text-[#878787]">Finding services...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center text-sm">
                    {error}
                </div>
            )}

            {/* Services List */}
            {!isLoading && !error && (
                <div className="space-y-4">
                    {services.length > 0 ? (
                        <div className="grid gap-4">
                            {services.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    id={service.id}
                                    image={getServiceCardImage(service)}
                                    profileImage={service.provider.profilePicture}
                                    name={`${service.provider.firstName} ${service.provider.lastName}`}
                                    handle={getProviderHandle(service.provider)}
                                    title={service.title}
                                    experience="5+ years"
                                    languages={Array.isArray(service.worker?.languages) ? service.worker.languages.join(", ") : ""}
                                    location={Array.isArray(service.serviceAreas) ? (service.serviceAreas[0] || "") : service.serviceAreas || ""}
                                    price={formatPrice(service.priceMin, service.priceMax, service.priceType)}
                                    rating={service.reviews.averageRating || 0}
                                    reviews={service.reviews.totalReviews || 0}
                                    distance="2.5 miles"
                                    available={true}
                                    verified={isEmployer(service.provider.roles)} 
                                    onClick={() => router.push(getServiceDetailPath(service))}
                                    onHireClick={() => router.push(`/book/${getBookingType(service)}/${service.id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Icons.SearchIcon className="w-8 h-8 fill-gray-300" />
                            </div>
                            <h3 className="text-base font-bold text-[#1B2431]">No results found</h3>
                            <p className="text-sm text-[#878787] mt-1 max-w-[200px]">
                                Try adjusting your search or filters to find what you&apos;re looking for.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <FilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />
        </div>
    );
};

export default ServicePage;
