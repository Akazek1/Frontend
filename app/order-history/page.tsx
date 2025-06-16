"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BackButtonHeader from "@/components/header/back-button-header";
import { CircleCheck, Loader2 } from "lucide-react";
import { Icons } from "@/components/icons";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Define interfaces based on API response
interface Address {
  street: string;
  city: string;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface Service {
  id: string;
  title: string;
}

interface Booking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledFor: string;
  service: Service;
  address: Address;
  worker: Worker | null; // Allow null for cases where worker is not assigned
  review: null | { rating: number; comment: string };
  price?: number;
}

interface Category {
  category: string;
  orders: {
    id: string;
    status: string;
    provider: string;
    profession: string;
    date: string;
    amount?: string;
  }[];
}

const OrderHistory: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format ISO date to "Monday, 26th January 2024"
  const formatDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const suffix = getDaySuffix(day);
      return `${dayName}, ${day}${suffix} ${month} ${year}`;
    } catch {
      return "Invalid Date";
    }
  };

  // Get day suffix (1st, 2nd, 3rd, etc.)
  const getDaySuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Exponential backoff retry mechanism
  async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const status =
          typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 429 || (typeof status === "number" && status >= 500)) {
          const delay = baseDelay * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw lastError || new Error("Retry failed");
  };

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await retryWithBackoff(() => api.get<{ data: Booking[] }>("/bookings"));
        const bookings: Booking[] = Array.isArray(response.data.data) ? response.data.data : [];

        // Group bookings by service title
        const groupedByCategory: Category[] = bookings.reduce((acc: Category[], booking: Booking) => {
          const category = booking.service.title.toUpperCase();
          const order = {
            id: booking.id,
            status:
              booking.status === "COMPLETED"
                ? "Job Completed"
                : booking.status === "CANCELLED"
                  ? "Job Cancelled"
                  : booking.status,
            provider: booking.worker
              ? `${booking.worker.firstName} ${booking.worker.lastName}`
              : "Unknown Worker",
            profession: booking.service.title,
            date: formatDate(booking.scheduledFor),
            amount: booking.price ? `${booking.price} RWF` : undefined,
          };

          const existingCategory = acc.find((cat) => cat.category === category);
          if (existingCategory) {
            existingCategory.orders.push(order);
          } else {
            acc.push({ category, orders: [order] });
          }
          return acc;
        }, []);

        // Sort categories and orders
        const sortedCategories = groupedByCategory.sort((a, b) => a.category.localeCompare(b.category));
        sortedCategories.forEach((cat) => {
          cat.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        setCategories(sortedCategories);
        setError(null);
      } catch (err: unknown) {
        console.error("Error fetching bookings:", err); // Log for debugging
        let message = "Failed to fetch order history";
        if (typeof err === "object" && err !== null && "response" in err) {
          const response = (err as { response?: { data?: { message?: string } } }).response;
          if (response?.data?.message) {
            message = response.data.message;
          }
        }
        setError(message);
        toast.error(message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Handle book again
  const handleBookAgain = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1FCEF] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F1FCEF] p-4">
        <BackButtonHeader text="Order History" backHref="/" />
        <div className="text-center text-red-500 py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1FCEF]">
      <BackButtonHeader text="Order History" className="p-6" backHref="/" />

      {/* Order History List */}
      <div className="px-6 pb-10">
        {categories.length === 0 ? (
          <p className="text-center text-[#616161] font-medium">No orders found.</p>
        ) : (
          categories.map((category, index) => (
            <div key={index} className="">
              {/* Category Header */}
              <h2 className="py-6 text-xl font-bold text-[#212121] capitalize">{category.category}</h2>

              {/* Orders under this category */}
              <div className="space-y-4">
                {category.orders.map((order, orderIndex) => (
                  <div
                    key={orderIndex}
                    className="bg-white/50 shadow-sm p-5 space-y-3 rounded-[32px] border border-gray-100"
                  >
                    {/* Status and Expand Icon */}
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs text-white font-bold text-[10px] py-1 px-2.5 rounded-full ${order.status === "Job Completed" ? "bg-[#145B10]" : "bg-[#C01212]"
                          }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Provider and Profession */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#616161]">{order.provider}</p>
                        <p className="text-[#212121] text-lg font-bold capitalize">{order.profession}</p>
                      </div>
                      <Icons.BookMarkIcon className="stroke-[#145B10]" />
                    </div>

                    {/* Date */}
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-[#616161] font-medium">{order.date}</p>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      {/* Amount Paid (if applicable) */}
                      {order.status === "COMPLETED" && order.amount && (
                        <div className="flex items-center mt-1">
                          <CircleCheck className="w-4 h-4 mr-1" />
                          <p className="text-xs text-[#145B10] w-max font-bold">
                            Amount Paid {order.amount}
                          </p>
                        </div>
                      )}

                      {/* Book Again Button */}
                      <div className="flex items-center justify-end w-full">
                        <Button
                          className="w-max rounded-full border border-[#145B10] text-[#145B10] font-bold bg-transparent hover:bg-[#145B10] hover:text-white py-2"
                          onClick={() => handleBookAgain(order.id)}
                        >
                          Give Feedback
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderHistory;