"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Service } from "@/types";
import { UserProfileHeader } from "@/components/profile/user-profile-header";
import { AboutMe } from "@/components/profile/about-me";
import { PersonalInfo } from "@/components/profile/personal-info";
import { WhyClientsChooseMe } from "@/components/profile/why-clients-choose-me";
import { ServicesGrid } from "@/components/profile/services-grid";

type AddressLite = {
  street?: string;
  city?: string;
  district?: string;
  sector?: string;
  country?: string;
};

type UserProfile = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  profileImages?: string[];
  roles?: string[];
  languages?: string[];
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  email?: string;
  isVerified?: boolean;
  governmentIdStatus?: string;
  createdAt?: string;
  healthStatus?: string;
  preferredWorkTime?: string;
  topQualities?: string[];
  addresses?: AddressLite[];
  availability?: Array<{ id: string; dayOfWeek?: number; startTime?: string; endTime?: string }>;
};

const formatLocation = (addr?: AddressLite) => {
  if (!addr) return undefined;
  return [addr.district || addr.sector, addr.city, addr.country].filter(Boolean).join(", ");
};

export default function HandleProfilePage() {
  const params = useParams<{ handle: string }>();
  const handle = (params?.handle as string) || "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!handle) {
        setError("Invalid handle");
        setLoading(false);
        return;
      }
      try {
        // Always fetch the user record (includes the new profile fields).
        const userResp = await api.get(`/users/username/${handle}`);
        const userData: UserProfile = userResp.data?.data || userResp.data;

        // Fetch services in parallel (separate endpoint, optional).
        let serviceList: Service[] = [];
        try {
          const svcResp = await api.get(`/services?providerUsername=${handle}`);
          const raw = svcResp.data?.data;
          serviceList = Array.isArray(raw) ? raw : raw?.data || [];
        } catch {
          serviceList = [];
        }

        if (!cancelled) {
          setProfile(userData);
          setServices(serviceList);
          setError(null);
        }
      } catch (err) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        const message = e?.response?.data?.message || e?.message || "Profile not found";
        if (!cancelled) {
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFCF9]">
        <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FAFCF9] p-6">
        <p className="text-center text-red-500 py-12">{error || "Profile not found"}</p>
      </div>
    );
  }

  const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.username || "User";
  const addr = profile.addresses?.[0];
  const homeLocation = formatLocation(addr);
  const availableToday = (profile.availability?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-[#FAFCF9] pb-8">
      <UserProfileHeader
        name={name}
        handle={profile.username || handle}
        profilePicture={profile.profilePicture}
        isVerified={profile.isVerified}
        governmentIdStatus={profile.governmentIdStatus}
        availableToday={availableToday}
        city={addr?.city}
        district={addr?.district || addr?.sector}
        country={addr?.country}
        languages={profile.languages}
        memberSince={profile.createdAt}
      />

      <AboutMe bio={profile.bio} />

      <PersonalInfo
        dateOfBirth={profile.dateOfBirth}
        gender={profile.gender}
        email={profile.email}
        homeLocation={homeLocation}
        healthStatus={profile.healthStatus}
        preferredWorkTime={profile.preferredWorkTime}
      />

      <WhyClientsChooseMe qualities={profile.topQualities} roles={profile.roles} />

      <ServicesGrid services={services} />
    </div>
  );
}
