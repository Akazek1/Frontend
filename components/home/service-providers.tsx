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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const providerPic = (service.provider as any).profilePicture;
      const titleKey = service.title.toLowerCase();
      const fallbackImage =
        titleKey.includes("clean") ? "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400"
        : titleKey.includes("cook") ? "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400"
        : titleKey.includes("nanny") || titleKey.includes("babysit") || titleKey.includes("child") ? "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400"
        : titleKey.includes("repair") || titleKey.includes("electric") || titleKey.includes("plumb") ? "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400"
        : titleKey.includes("paint") ? "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=400"
        : titleKey.includes("garden") ? "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400"
        : titleKey.includes("laundry") ? "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=400"
        : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400";
      const image = service.serviceImage || providerPic || fallbackImage;

      const firstName = service.provider.firstName.toLowerCase().replace(/\s+/g, "");
      const lastName = service.provider.lastName.toLowerCase().replace(/\s+/g, "");
      const handle = `@${firstName}_${lastName}${service.id.slice(0, 4)}`;

      return {
        id: service.id,
        image,
        name: `${service.provider.firstName} ${service.provider.lastName}`,
        handle,
        title: service.title,
        experience: service.description || "",
        languages: Array.isArray(service?.provider?.languages)
          ? service.provider.languages.join(", ")
          : "",
        location: areas[0] || "",
        price: formatPrice(service.priceMin, service.priceMax, service.priceType),
        rating: service?.reviews?.averageRating || 0,
        reviews: service?.reviews?.totalReviews || 0,
        distance: "",
        available: service.isActive,
        verified: true,
        type: service.provider.userType === "AGENCY" ? "AGENCY" : "INDIVIDUAL",
        providerId: service.providerId,
        username: service.provider.username,
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
                    if (!provider.username && !provider.providerId) {
                      toast.error("Invalid provider");
                      return;
                    }
                    // Route to provider profile page (not booking flow)
                    const route = provider.username ? `/provider/${provider.username}` : `/provider/${provider.providerId}`;
                    router.push(route);
                  }}
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
