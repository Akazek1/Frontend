import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isGuestBrowsingEnabled } from "@/lib/feature-flags";
import { isMarketingHost } from "@/lib/marketing-host";

export function middleware(request: NextRequest) {
  // Host-based split: the apex domain (huza.app / www.huza.app) is the public
  // marketing site; the app lives on app.huza.app. On the apex, serve the
  // marketing homepage at "/" (rewrite keeps the clean URL — no /welcome shown).
  const host = request.headers.get("host") || "";
  if (isMarketingHost(host) && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/welcome", request.url));
  }

  if (request.nextUrl.pathname === "/bookings" || request.nextUrl.pathname === "/jobs") {
    const workUrl = new URL("/work", request.url);
    workUrl.search = request.nextUrl.search;
    return NextResponse.redirect(workUrl, 301);
  }

  // Check for token in cookies or Authorization header
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  const isAuthenticated = !!token;
  const isProfileComplete = request.cookies.get("profileComplete")?.value === "true";

  // Phase 1 redesign: when guest browsing is enabled, the home and the jobs
  // feed/detail become publicly browseable; everything else stays gated.
  // When the flag is off, behavior is identical to before.
  const guestBrowsing = isGuestBrowsingEnabled();

  // Protected routes that require authentication
  const protectedRoutesBase = ["/profile", "/more", "/book", "/checkout", "/bookings", "/jobs", "/work", "/conversations", "/organization", "/post-job", "/received-bookings"];

  // Public routes that don't require authentication
  const publicRoutesBase = ["/provider"];

  const protectedRoutes = protectedRoutesBase;
  const publicRoutes = publicRoutesBase;

  // Under guest browsing, /jobs/[id] (job detail) is public for browsing,
  // but /jobs exact (worker dashboard) stays protected.
  const isJobDetailPublic =
    guestBrowsing && request.nextUrl.pathname.startsWith("/jobs/");

  const isPublicRoute =
    isJobDetailPublic ||
    publicRoutes.some(
      (route) =>
        request.nextUrl.pathname === route ||
        request.nextUrl.pathname.startsWith(route + "/")
    );

  const protectedRoots = protectedRoutes;

  const isProtectedRoute = protectedRoots.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(route + "/")
  ) && !isPublicRoute; // Exclude public routes from protection

  // If trying to access a protected route without being logged in:
  // - Guest browsing ON  → send to home (guest can browse freely; auth gate handles action prompts)
  // - Guest browsing OFF → send to onboarding with redirect param (original behaviour)
  if (isProtectedRoute && !isAuthenticated) {
    if (guestBrowsing) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const onboardingUrl = new URL("/onboarding", request.url);
    onboardingUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(onboardingUrl);
  }

  // If authenticated but profile incomplete, redirect to onboarding to finish signup
  if (isProtectedRoute && isAuthenticated && !isProfileComplete) {
    const onboardingUrl = new URL("/onboarding", request.url);
    onboardingUrl.searchParams.set("step", "complete-profile");
    return NextResponse.redirect(onboardingUrl);
  }

  // If trying to access onboarding while logged in with complete profile, redirect to home
  if (request.nextUrl.pathname === "/onboarding" && isAuthenticated && isProfileComplete) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/",
    "/profile/:path*",
    "/more/:path*",
    "/book/:path*",
    "/checkout/:path*",
    "/provider/:path*",
    "/bookings/:path*",
    "/jobs/:path*",
    "/work/:path*",
    "/conversations/:path*",
    "/organization/:path*",
    "/post-job/:path*",
    "/post-job",
    "/received-bookings/:path*",
    "/onboarding",
  ],
};
