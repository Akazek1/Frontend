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
  availability: never[];
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
  providerId?: string;
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
    phoneNumber?: string;
    trustScore?: number;
    createdAt?: string;
  };
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
  };
  serviceAreas: string[];
}

export interface Provider {
  id: string;
  image: string;
  profileImage?: string;
  name: string;
  handle: string;
  title: string;
  experience: string;
  languages: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  distance: string;
  available: boolean;
  verified: boolean;
  type: string;
  phoneNumber?: string;
  providerId?: string;
  username?: string;
}
