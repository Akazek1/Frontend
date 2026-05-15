"use client";
import React, { useEffect, useState } from "react";
import ServiceCard from "../service-card";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Provider, Service } from "@/types";
import { getBookingType, getProviderHandle, getServiceCardImage } from "@/lib/service-display";
import APP_CONFIG from "@/constant/app.config";

interface ServiceProviderProps {
  showHeader: boolean;
}

const ServiceProvider: React.FC<ServiceProviderProps> = () => {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/services");
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        const validatedServices = data.filter(
          (service: Service) =>
            service.id && typeof service.id === "string" && service.id.trim() !== ""
        );
        setServices(validatedServices);
        setError(null);
      } catch (err) {
        const message = (err as Error).message || "Failed to fetch services";
        setError(message);
        toast.error(message);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredProviders: Provider[] = services
    .map((service) => {
      const areas = Array.isArray(service.serviceAreas)
        ? service.serviceAreas
        : service.serviceAreas
        ? [service.serviceAreas as string]
        : [];

      const image = getServiceCardImage(service);

      return {
        id: service.id,
        image,
        name: `${service.provider.firstName} ${service.provider.lastName}`,
        handle: getProviderHandle(service.provider),
        title: service.title,
        experience: service.description || "",
        languages: Array.isArray(service?.provider?.languages)
          ? service.provider.languages.join(", ")
          : "",
        location: areas[0] || "",
        price: formatPrice(service.priceMin, service.priceMax, service.priceType),
        rating: service?.reviews?.averageRating || 0,
        reviews: service?.reviews?.totalReviews || 0,
        distance: APP_CONFIG.serviceDetail.fallbackDistance,
        available: service.isActive,
        verified: true,
        type: getBookingType(service),
        providerId: service.providerId,
        username: service.provider.username,
        profileImage: service.provider.profilePicture || service.provider.profileImg,
      };
    });

  return (
    <div>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-8"
          >
            <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-500 py-4"
          >
            {error}
          </motion.div>
        ) : (
          <motion.div
            key="services"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex flex-col gap-3 pb-8 mt-2"
          >
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <ServiceCard
                  key={provider.id}
                  onClick={() => {
                    router.push(`/service/${provider.id}`);
                  }}
                  onHireClick={() => router.push(`/book/${provider.type}/${provider.id}`)}
                  {...provider}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No providers found.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceProvider;
