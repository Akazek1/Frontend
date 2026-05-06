import { redirect } from "next/navigation";

// Redirects legacy /order-history links to the new /bookings page
export default function OrderHistoryRedirect() {
  redirect("/bookings");
}
