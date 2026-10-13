import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HandleProfileClient } from "./handle-profile-client";
import APP_CONFIG from "@/constant/app.config";

interface ProfileMetaData {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
}

// Mirrors the backend's username rule (users.service.ts). This is a catch-all
// top-level route, so every unknown URL lands here — including scanner probes
// like /wp-login.php or /.env. Anything that can't be a username is rejected
// without a backend lookup.
const HANDLE_PATTERN = /^[a-z0-9_-]{3,30}$/i;

type ProfileLookup =
  | { status: "found"; profile: ProfileMetaData }
  | { status: "missing" }
  // Backend slow, down, or erroring — we can't tell, so never 404 on this.
  | { status: "unknown" };

async function lookupProfile(handle: string): Promise<ProfileLookup> {
  if (!HANDLE_PATTERN.test(handle)) return { status: "missing" };
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
    const res = await fetch(`${baseURL}/users/username/${handle}`, {
      // Profile info (bio, photo) changes rarely — cache the share preview
      // briefly rather than re-fetching on every crawler hit.
      next: { revalidate: 300 },
    });
    if (res.status === 404) return { status: "missing" };
    if (!res.ok) return { status: "unknown" };
    const json = await res.json();
    const profile = json?.data ?? json ?? null;
    return profile ? { status: "found", profile } : { status: "unknown" };
  } catch {
    return { status: "unknown" };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const lookup = await lookupProfile(handle);

  if (lookup.status !== "found") {
    return {
      title: `Profile | ${APP_CONFIG.seoName}`,
      // The providers in the root layout don't server-render their children,
      // so notFound() below can't change the HTTP status — the response is
      // still a 200. Tell crawlers not to index these soft-404s.
      ...(lookup.status === "missing" ? { robots: { index: false, follow: false } } : {}),
    };
  }
  const { profile } = lookup;

  const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.username || "User";
  const title = `${name} - ${APP_CONFIG.seoName}`;
  const description =
    profile.bio?.trim() ||
    `View ${name}'s profile on ${APP_CONFIG.seoName}. Find trusted help for your home and daily needs.`;
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

export default async function HandleProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  // Show the 404 page straight away for URLs that aren't a profile, rather
  // than letting the client look the handle up again. Same fetch as
  // generateMetadata, so Next dedupes it — no extra backend call.
  if ((await lookupProfile(handle)).status === "missing") notFound();

  return <HandleProfileClient />;
}
