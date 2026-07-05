import type { Metadata } from "next";
import { HandleProfileClient } from "./handle-profile-client";
import APP_CONFIG from "@/constant/app.config";

interface ProfileMetaData {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
}

async function fetchProfileForMetadata(handle: string): Promise<ProfileMetaData | null> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
    const res = await fetch(`${baseURL}/users/username/${handle}`, {
      // Profile info (bio, photo) changes rarely — cache the share preview
      // briefly rather than re-fetching on every crawler hit.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await fetchProfileForMetadata(handle);

  if (!profile) {
    return { title: `Profile - ${APP_CONFIG.name}` };
  }

  const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.username || "User";
  const title = `${name} - ${APP_CONFIG.name}`;
  const description =
    profile.bio?.trim() ||
    `View ${name}'s profile on ${APP_CONFIG.name}. Find trusted help for your home and daily needs.`;
  const image = profile.profilePicture;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function HandleProfilePage() {
  return <HandleProfileClient />;
}
