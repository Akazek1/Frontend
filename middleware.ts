import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for token in cookies or Authorization header
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  const isAuthenticated = !!token;
  const isProfileComplete = request.cookies.get("profileComplete")?.value === "true";

  // Protected routes that require authentication
  const protectedRoutes = ["/profile", "/more", "/book", "/checkout"];

  // Public routes that don't require authentication
  const publicRoutes = ["/provider"];

  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname.startsWith(route + "/")
  );

  const isProtectedRoute = ["/", ...protectedRoutes].some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(route + "/")
  ) && !isPublicRoute; // Exclude public routes from protection

  // If trying to access a protected route without being logged in, redirect to onboarding
  // Store the intended URL so we can redirect back after login
  if (isProtectedRoute && !isAuthenticated) {
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
    "/onboarding",
  ],
};
