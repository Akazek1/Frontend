import { Icons } from "@/components/icons";

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  matchPattern?: string;
}

export interface Service {
  service: Record<string, unknown>;
  id: string;
  title: string;
  description: string;
  priceMin: number;
  priceMax: number;
  priceType: string;
  category: { id: string; name: string; nameKn?: string; nameFr?: string; icon?: string } | string;
  serviceImage: string | null;
  serviceImages?: string[];
  isActive: boolean;
  // Project 2 Phase E — a card is owned by EITHER an individual provider OR a
  // Service Company; the other side is null. Company cards also carry an
  // approval status (only APPROVED ones reach the marketplace).
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  providerId?: string | null;
  provider: {
    id: string;
    username?: string;
    firstName: string;
    lastName: string;
    email: string;
    roles?: string[];
    languages?: string[];
    profilePicture?: string;
    profileImg?: string;
    profileImages?: string[];
    isVerified?: boolean;
    gender?: string;
    dateOfBirth?: string;
    bio?: string;
    educationLevel?: string;
    yearsOfExperience?: number | null;
    phoneNumber?: string;
    trustScore?: number;
    createdAt?: string;
    availableForWork?: boolean;
    addresses?: Array<{
      city?: string | null;
      district?: string | null;
      sector?: string | null;
      cell?: string | null;
      isDefault?: boolean;
    }>;
    agency?: {
      id: string;
      name: string;
      logoUrl: string | null;
      verified: boolean;
      _count?: { workers: number; placements: number };
    } | null;
  } | null;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
    type?: string;
    logoUrl: string | null;
    verified: boolean;
    description?: string | null;
    website?: string | null;
    coverImageUrl?: string | null;
    operatingHours?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;
  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    languages: string[];
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    wouldHireAgain?: number;
    jobsCompleted?: number;
  };
  serviceAreas: string[];
  distanceKm?: number | null;
}

export interface AgencyPlacement {
  id: string;
  status: "ACTIVE" | "TERMINATED" | "OPTED_OUT";
  placedAt: string;
  endedAt: string | null;
  commissionAmount: number | null;
  commissionPaid: boolean;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    isVerified: boolean;
    trustScore: number;
    username: string | null;
    services?: Array<{ id: string; title: string; priceMin: number | null; priceMax: number | null; priceType: string | null }>;
  };
  agency: {
    id: string;
    name: string;
    logoUrl: string | null;
    verified: boolean;
    phone: string | null;
    _count?: { workers: number; placements: number };
  };
  employer: { id: string; firstName: string; lastName: string };
}

export interface Provider {
  id: string;
  image: string;
  profileImage?: string;
  name: string;
  handle?: string;
  title: string;
  experience: string;
  languages: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  jobsCompleted?: number;
  wouldHireAgain?: number;
  distance?: string;
  available: boolean;
  verified: boolean;
  type: string;
  phoneNumber?: string;
  providerId?: string;
  username?: string;
  agency?: {
    id: string;
    name: string;
    logoUrl: string | null;
    verified: boolean;
  } | null;
}
