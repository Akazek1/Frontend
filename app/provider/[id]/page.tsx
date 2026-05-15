"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Loader2, Phone, MessageCircle, Share, MapPin, Briefcase, Star, Clock } from "lucide-react";
import { Languages as LanguagesIcon } from "lucide-react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Service } from "@/types";
import { ProfileHeader } from "@/components/provider/profile-header";
import { ImageGallery } from "@/components/provider/image-gallery";
import { ReportModal } from "@/components/provider/report-modal";
import { formatPrice } from "@/lib/utils";
import { getProviderHandle, getServiceCardImage, shouldUnoptimizeImage } from "@/lib/service-display";
import Image from "next/image";
import Link from "next/link";

type Provider = {
  id: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  bio?: string;
  profilePicture?: string;
  profileImages?: string[];
  isVerified?: boolean;
  createdAt?: string;
  userType: string;
  phoneNumber?: string;
  languages?: string[];
  trustScore?: number;
};

type ProviderApi = Partial<Provider> & {
  id: string;
  provider?: ProviderApi;
};

function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.id as string;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    function mapProvider(data: ProviderApi): Provider {
      return {
        id: data.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        bio: data.bio,
        profilePicture: data.profilePicture,
        profileImages: data.profileImages || [],
        isVerified: data.isVerified,
        createdAt: data.createdAt,
        userType: data.userType || "INDIVIDUAL",
        phoneNumber: data.phoneNumber,
        languages: data.languages || [],
        trustScore: data.trustScore,
      };
    }

    async function fetchProviderData() {
      if (!username || typeof username !== "string") {
        setError("Invalid provider username");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/services?providerUsername=" + username);
        const servicesData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data?.data || [];

        if (servicesData.length === 0) {
          try {
            const userResponse = await api.get("/users/username/" + username);
            const userData = userResponse.data.data || userResponse.data;
            setProvider(mapProvider(userData));
            setServices([]);
            setError(null);
          } catch {
            setError("Provider not found");
          }
        } else {
          setProvider(mapProvider(servicesData[0].provider));
          setServices(servicesData);
          setError(null);
        }
      } catch (err: unknown) {
        const providerError = err as { response?: { data?: { message?: string } }; message?: string };
        const message = providerError?.response?.data?.message || providerError?.message || "Failed to fetch provider";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    fetchProviderData();
  }, [username]);

  function handleShare() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Failed to copy link"));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="p-4 md:p-6">
        <BackButtonHeader text="Provider Profile" backHref="/" />
        <div className="text-center text-red-500 py-4">{error || "Not found"}</div>
      </div>
    );
  }

  const providerName = (provider.firstName + " " + provider.lastName).trim();
  const allAreas = Array.from(new Set(services.flatMap((s) => s.serviceAreas || [])));
  const allReviewsCount = services.reduce((sum, s) => sum + (s.reviews?.totalReviews || 0), 0);
  const ratings = services.flatMap((s) => (s.reviews?.averageRating ? [s.reviews.averageRating] : []));
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-32 min-h-screen">
      <BackButtonHeader text="Provider Profile" backHref="/" />

      <main className="space-y-6 max-w-3xl mx-auto">
        <ProfileHeader
          name={providerName}
          gender={provider.gender}
          dateOfBirth={provider.dateOfBirth}
          profilePicture={provider.profilePicture}
          isVerified={provider.isVerified}
          createdAt={provider.createdAt}
          rating={avgRating}
          reviewCount={allReviewsCount}
          trustScore={provider.trustScore}
          onReportClick={() => setShowReportModal(true)}
        />

        {provider.bio ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">About the provider</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{provider.bio}</p>
          </div>
        ) : null}

        {(provider.profileImages && provider.profileImages.length > 0) || provider.profilePicture ? (
          <ImageGallery
            images={provider.profileImages || []}
            profilePicture={provider.profilePicture}
            title="Photos"
          />
        ) : null}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Details</h3>

          <div className="space-y-3 mb-4">
            {provider.languages && provider.languages.length > 0 ? (
              <div className="flex items-start gap-3">
                <LanguagesIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Speaks</p>
                  <p className="text-sm font-medium text-gray-900">{provider.languages.join(", ")}</p>
                </div>
              </div>
            ) : null}

            {allAreas.length > 0 ? (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Service Areas</p>
                  <p className="text-sm font-medium text-gray-900">{allAreas.join(", ")}</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Services Offered</p>
                <p className="text-sm font-medium text-gray-900">{services.length} service{services.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-100">
            {provider.phoneNumber ? (
              <a
                href={"tel:" + provider.phoneNumber}
                className="flex items-center gap-2 px-4 py-2 bg-[#145B10] text-white rounded-lg hover:bg-[#145B10]/90 text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            ) : null}
            <Link
              href="/conversations"
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#145B10] text-[#145B10] rounded-lg hover:bg-[#145B10]/10 text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Share className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Services {services.length > 0 ? "(" + services.length + ")" : ""}
          </h3>

          {services.length === 0 ? (
            <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-2xl">
              No services available yet
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => {
                const areas = Array.isArray(service.serviceAreas) ? service.serviceAreas : [];
                const price = formatPrice(service.priceMin, service.priceMax, service.priceType);
                const rating = service.reviews?.averageRating || 0;
                const reviewCount = service.reviews?.totalReviews || 0;

                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="relative w-full h-40 bg-gray-100">
                      <Image
                        src={getServiceCardImage(service) || "/default-service.svg"}
                        alt={service.title}
                        fill
                        className="object-cover"
                        unoptimized={shouldUnoptimizeImage(getServiceCardImage(service) || "/default-service.svg")}
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                      {service.isActive ? (
                        <span className="absolute top-3 left-3 bg-[#145B10] text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Available
                        </span>
                      ) : null}
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-gray-900 capitalize">{service.title}</h4>
                          <p className="text-xs text-gray-500">{getProviderHandle(service.provider)}</p>
                        </div>
                        {rating > 0 ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
                            <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({reviewCount})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">New</span>
                        )}
                      </div>

                      {service.description ? (
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {service.description}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                        {areas.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{areas.join(", ")}</span>
                          </div>
                        ) : null}
                        {service.availability && service.availability.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{service.availability.length} day{service.availability.length !== 1 ? "s" : ""} available</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        <p className="text-lg font-bold text-[#145B10]">{price}</p>
                        <button
                          type="button"
                          onClick={() => router.push(`/service/${service.id}`)}
                          className="bg-[#145B10] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0f4a0c] transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showReportModal ? (
        <ReportModal
          targetId={provider.id}
          targetName={providerName}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setShowReportModal(false);
            toast.success("Thank you for helping keep our community safe");
          }}
        />
      ) : null}
    </div>
  );
}

export default ProviderProfilePage;
