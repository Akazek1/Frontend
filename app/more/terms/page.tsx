import { redirect } from "next/navigation";

// Terms now live at the public /terms route (readable without auth). Keep this
// path working by redirecting to the canonical page.
export default function MoreTermsRedirect() {
  redirect("/terms");
}
