"use client";
import React, { useEffect, useState } from "react";
import ServiceCard from "../service-card";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { Loader2, X } from "lucide-react";
import { Provider, Service } from "@/types";
import { getBookingType, getProviderHandle, getServiceCardImage } from "@/lib/service-display";
import APP_CONFIG from "@/constant/app.config";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface HireModal {
  serviceId: string;
  providerName: string;
  serviceTitle: string;
}

interface ServiceProviderProps {
  showHeader: boolean;
}

const ServiceProvider: React.FC<ServiceProviderProps> = () => {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { requireAuth } = useRequireAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hireModal, setHireModal] = useState<HireModal | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestedServiceIds, setRequestedServiceIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/bookings");
        const bookings = Array.isArray(response.data.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];
        const inactive = new Set(["CANCELLED", "REJECTED"]);
        const ids = new Set<string>(
          bookings
            .filter((b: any) => b?.service?.id && !inactive.has(String(b.status).toUpperCase()))
            .map((b: any) => b.service.id as string)
        );
        setRequestedServiceIds(ids);
      } catch {
        // silent — button just defaults to "Request to Hire"
      }
    };
    fetchBookings();
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

  const handleHireSubmit = async () => {
    if (!hireModal) return;
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        serviceId: hireModal.serviceId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success(`Booking request sent to ${hireModal.providerName}!`);
      setRequestedServiceIds((prev) => {
        const next = new Set(prev);
        next.add(hireModal.serviceId);
        return next;
      });
      setHireModal(null);
      setNotes("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
                    router.push(`/${provider.handle.replace("@", "")}/services/${provider.id}`);
                  }}
                  onHireClick={() => {
                    if (currentUserId && provider.providerId === currentUserId) {
                      toast.error("You can't book your own service.");
                      return;
                    }
                    if (requestedServiceIds.has(provider.id)) return;
                    requireAuth(() => setHireModal({
                      serviceId: provider.id,
                      providerName: provider.name,
                      serviceTitle: provider.title,
                    }), "hire");
                  }}
                  {...provider}
                  hasRequested={requestedServiceIds.has(provider.id)}
                  isOwnService={Boolean(currentUserId && provider.providerId === currentUserId)}
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

      {/* Request to Hire modal */}
      {hireModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
          <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#145B10] uppercase tracking-wider">Request to Hire</p>
                <h3 className="text-[17px] font-black text-[#1B2431] mt-0.5">{hireModal.providerName}</h3>
                <p className="text-[13px] text-gray-400">{hireModal.serviceTitle}</p>
              </div>
              <button onClick={() => { setHireModal(null); setNotes(""); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[12px] font-semibold text-[#1B2431] block mb-1.5">
                Message <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what you need, preferred schedule, or any specific requirements…"
                rows={3}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] text-[#1B2431] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#145B10]/30 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setHireModal(null); setNotes(""); }}
                className="flex-1 h-12 rounded-[18px] border-2 border-gray-100 text-gray-500 font-bold text-[13px] hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleHireSubmit}
                disabled={submitting}
                className="flex-1 h-12 rounded-[18px] bg-[#145B10] text-white font-bold text-[13px] hover:bg-[#0F4D0C] shadow-lg shadow-[#145B10]/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProvider;
