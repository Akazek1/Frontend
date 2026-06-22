import { redirect } from "next/navigation";

// Privacy policy now lives at the public /privacy route (readable without auth).
// Keep this path working by redirecting to the canonical page.
export default function MorePrivacyRedirect() {
  redirect("/privacy");
}
