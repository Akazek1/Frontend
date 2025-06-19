"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import ServiceCard from "@/components/service-card"; // Adjust the import path as needed
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

interface Service {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    provider: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        userType: string;
        profileImg: string;
    };
    worker: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

const ServicePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get("category");
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (category) {
            fetchServices(category as string);
        }
    }, [category]);

    const fetchServices = async (category: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/services?category=${encodeURIComponent(category.toLowerCase())}`);
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
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header with Back Arrow */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack} className="p-2">
                    <ArrowLeft className="w-8 h-8" />
                </Button>
                <h1 className="text-lg font-semibold text-[#1B2431] capitalize">
                    {category || "Services"}
                </h1>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center text-[#878787]">Loading services...</div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center text-red-500">{error}</div>
            )}

            {/* Services List */}
            {!isLoading && !error && services.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[#1B2431]">Available Services</h2>
                    <div className="grid gap-4">
                        {services.map((service) => (
                            <ServiceCard
                                key={service.id}
                                id={service.id}
                                image={service.provider.profileImg || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800"}
                                name={`${service.provider.firstName} ${service.provider.lastName}`}
                                title={service.title}
                                experience="5+ years"
                                languages="English, Spanish"
                                location="New York, NY"
                                price={`$${service.price}`}
                                rating={4.5}
                                reviews={120}
                                distance="2.5 miles"
                                available={true}
                                verified={service.provider.userType === "AGENCY"} // Example logic
                                onClick={() => router.push(`/book/${service.provider.userType}/${service.id}`)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {!isLoading && !error && services.length === 0 && (
                <div className="text-center text-[#878787]">
                    No services found for this category.
                </div>
            )}
        </div>
    );
};

export default ServicePage;