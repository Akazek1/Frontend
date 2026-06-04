"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/axios";
import ServiceCard from "@/components/service-card";
import { useRouter, useSearchParams } from "next/navigation";
import { Service } from "@/types";
import BackButtonHeader from "@/components/header/back-button-header";
import { formatPrice } from "@/lib/utils";
import { getBookingType, getProviderHandle, getServiceCardImage, getServiceDetailPath } from "@/lib/service-display";
import { Icons } from "@/components/icons";
import FilterModal, { FilterValues } from "@/components/search/filter-modal";


const ServicePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get("category");
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState(searchParams.get("search") || "");
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [filters, setFilters] = useState<FilterValues>({
        minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
        maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
        serviceType: searchParams.get("serviceType") || undefined,
        availability: searchParams.get("availability") || undefined,
        location: searchParams.get("location") || undefined,
        distanceKm: searchParams.get("distanceKm") ? Number(searchParams.get("distanceKm")) : undefined,
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
            if (filters.availability) params.append("available", filters.availability === "available" ? "true" : "false");
            if (filters.location) params.append("location", filters.location);
            if (filters.distanceKm) params.append("distanceKm", filters.distanceKm.toString());
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
        const value = e.target.value;
        setInputValue(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => setSearchTerm(value), 350);
    };

    const handleApplyFilters = (newFilters: FilterValues) => {
        setFilters(newFilters);
        // Update URL to reflect current search/filter state
        const params = new URLSearchParams(searchParams.toString());
        if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice.toString()); else params.delete("minPrice");
        if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice.toString()); else params.delete("maxPrice");
        if (newFilters.serviceType) params.set("serviceType", newFilters.serviceType); else params.delete("serviceType");
        if (newFilters.availability) params.set("availability", newFilters.availability); else params.delete("availability");
        if (newFilters.location) params.set("location", newFilters.location); else params.delete("location");
        if (newFilters.distanceKm) params.set("distanceKm", newFilters.distanceKm.toString()); else params.delete("distanceKm");
        if (newFilters.minRating) params.set("minRating", newFilters.minRating.toString()); else params.delete("minRating");
        router.push(`/service?${params.toString()}`);
    };

    return (
        <div className="bg-surface min-h-dvh space-y-6 p-6">
            {/* Header with Back Arrow */}
            <BackButtonHeader text={category || "Services"} backHref="/" />

            <div className="rounded-3xl border border-[#DDEDDD] bg-white p-3 shadow-sm">
                <div className="relative">
                    <Icons.SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 fill-[#878787]" />
                    <input
                        type="text"
                        placeholder="Search name, service, category, area"
                        className="h-12 w-full rounded-2xl border border-[#DDE3DD] bg-[#FAFFFA] pl-11 pr-4 text-[14px] font-medium text-ink outline-none transition placeholder:text-[13px] placeholder:font-medium placeholder:text-[#7A827A] focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                        value={inputValue}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A827A]">Refine results</p>
                        <p className="truncate text-[12px] text-[#4B554B]">Service type, area, price, availability</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-brand px-4 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-brand-dark"
                    >
                        <Icons.FilerIcon className="w-4 h-4 fill-white" />
                        Filter
                        {Object.values(filters).filter(Boolean).length > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand">
                                {Object.values(filters).filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
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
                                    experience={service.provider.bio || ""}
                                    languages={Array.isArray(service.provider.languages) ? service.provider.languages.join(", ") : ""}
                                    location={Array.isArray(service.serviceAreas) ? (service.serviceAreas[0] || "") : service.serviceAreas || ""}
                                    price={formatPrice(service.priceMin, service.priceMax, service.priceType)}
                                    rating={service.reviews?.averageRating || 0}
                                    reviews={service.reviews?.totalReviews || 0}
                                    distance={filters.distanceKm ? `Within ${filters.distanceKm} km` : "Nearby"}
                                    available={service.isActive}
                                    verified={service.provider.isVerified}
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
                            <h3 className="text-base font-bold text-ink">No results found</h3>
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
