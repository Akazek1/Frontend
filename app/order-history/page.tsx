'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import BackButtonHeader from '@/components/header/back-button-header';
import { CircleCheck, Loader2, MessageCircleMore, Star } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

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
  providerId: string;
}

interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledFor: string;
  service: Service;
  address: Address;
  worker: Worker | null;
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
    reviewSubmitted: boolean;
    service: Service;
  }[];
}

const OrderHistory: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed'>('All');

  // Format ISO date to "Monday, 26th January 2024"
  const formatDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const suffix = getDaySuffix(day);
      return `${dayName}, ${day}${suffix} ${month} ${year}`;
    } catch {
      return 'Invalid Date';
    }
  };

  // Get day suffix (1st, 2nd, 3rd, etc.)
  const getDaySuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
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
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 429 || (typeof status === 'number' && status >= 500)) {
          const delay = baseDelay * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw lastError || new Error('Retry failed');
  }

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await retryWithBackoff(() => api.get<{ data: Booking[] }>('/bookings'));
        const bookings: Booking[] = Array.isArray(response.data.data) ? response.data.data : [];

        // Group bookings by service title
        const groupedByCategory: Category[] = bookings.reduce((acc: Category[], booking: Booking) => {
          const category = booking.service.title.toUpperCase();
          const order = {
            id: booking.id,
            status:
              booking.status === 'COMPLETED'
                ? 'Job Completed'
                : booking.status === 'CANCELLED'
                  ? 'Job Cancelled'
                  : booking.status,
            provider: booking.worker
              ? `${booking.worker.firstName} ${booking.worker.lastName}`
              : 'Agency Worker',
            profession: booking.service.title,
            date: formatDate(booking.scheduledFor),
            amount: booking.price ? `${booking.price} RWF` : undefined,
            reviewSubmitted: !!booking.review,
            service: booking.service,
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
        console.error('Error fetching bookings:', err);
        let message = 'Failed to fetch order history';
        if (typeof err === 'object' && err !== null && 'response' in err) {
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

  // Handle opening review modal
  const openReviewModal = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setRating(0);
    setComment('');
    setReviewModalOpen(true);
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!selectedBookingId) return;
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please provide a comment.');
      return;
    }

    setSubmitting(true);
    try {
      await retryWithBackoff(() =>
        api.post(`/bookings/${selectedBookingId}/reviews`, { rating, comment })
      );
      toast.success('Review submitted successfully!');
      // Update categories to reflect review submission
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          orders: cat.orders.map((order) =>
            order.id === selectedBookingId ? { ...order, reviewSubmitted: true } : order
          ),
        }))
      );
      setReviewModalOpen(false);
    } catch (err: unknown) {
      console.error('Error submitting review:', err);
      let message = 'Failed to submit review';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          message = response.data.message;
        }
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter categories based on active tab
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      orders: category.orders.filter((order) => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Pending') return order.status === 'PENDING';
        if (activeTab === 'Completed') return order.status === 'Job Completed';
        return false;
      }),
    }))
    .filter((category) => category.orders.length > 0);

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
      <BackButtonHeader text="Order History" className="p-4 sm:p-6" backHref="/" />

      {/* Tabs Navigation */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="flex sm:space-x-2 bg-white/50 rounded-md p-1 border border-gray-100">
          {['All', 'Pending', 'Completed'].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab
                  ? 'bg-[#145B10] text-white'
                  : 'text-[#616161] hover:bg-gray-100'
                }`}
              onClick={() => setActiveTab(tab as 'All' | 'Pending' | 'Completed')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="w-[90vw] max-w-[360px] sm:max-w-lg bg-white rounded-[32px] p-4">
          <DialogHeader>
            <DialogTitle className="text-[#1B2431] text-lg font-semibold">
              Submit Review
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 sm:w-8 sm:h-8 ${star <= rating ? 'fill-[#145B10] stroke-[#145B10]' : 'stroke-[#145B10]'
                      }`}
                  />
                </button>
              ))}
            </div>
            {/* Comment Input */}
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your feedback..."
              className="border-[#145B10] focus:ring-[#145B10] rounded-lg text-sm"
              rows={4}
            />
            {/* Submit Button */}
            <Button
              className="w-full rounded-[100px] font-bold bg-[#145B10] text-white hover:bg-[#145B10]/90 text-sm"
              onClick={handleSubmitReview}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order History List */}
      <div className="px-4 sm:px-6 pb-10 max-w-2xl mx-auto">
        {filteredCategories.length === 0 ? (
          <p className="text-center text-[#616161] font-medium text-sm sm:text-base">
            No orders found for this status.
          </p>
        ) : (
          filteredCategories.map((category, index) => (
            <div key={index} className="">
              {/* Category Header */}
              <h2 className="py-4 sm:py-6 text-lg sm:text-xl font-bold text-[#212121] capitalize">
                {category.category}
              </h2>

              {/* Orders under this category */}
              <div className="space-y-4">
                {category.orders.map((order, orderIndex) => (
                  <div
                    key={orderIndex}
                    className="bg-white/50 shadow-sm p-4 sm:p-5 space-y-3 rounded-[24px] sm:rounded-[32px] border border-gray-100"
                  >
                    {/* Status and Expand Icon */}
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-[10px] sm:text-xs text-white font-bold py-1 px-2.5 rounded-full ${order.status === 'PENDING'
                            ? 'bg-[#C01212]'
                            : order.status === 'Job Completed'
                              ? 'bg-[#145B10]'
                              : 'bg-[#C01212]'
                          }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Provider and Profession */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-[#616161]">
                          {order.provider}
                        </p>
                        <p className="text-base sm:text-lg font-bold text-[#212121] capitalize">
                          {order.profession}
                        </p>
                      </div>
                      <Link href={`/conversations/inbox/${order.id}`} className="flex items-center">
                        <MessageCircleMore className="w-5 h-5 sm:w-6 sm:h-6 stroke-[#145B10]" />
                      </Link>
                    </div>

                    {/* Date */}
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-1 sm:mr-2"
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
                      <p className="text-xs sm:text-sm text-[#616161] font-medium">{order.date}</p>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      {/* Amount Paid (if applicable) */}
                      {order.status === 'Job Completed' && order.amount && (
                        <div className="flex w-full items-center">
                          <CircleCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-[#145B10]" />
                          <p className="text-xs sm:text-sm text-[#145B10] font-bold">
                            Amount Paid {order.amount}
                          </p>
                        </div>
                      )}

                      {/* Give Feedback Button */}
                      <div className="flex items-center justify-end">
                        {order.status === 'Job Completed' && !order.reviewSubmitted && (
                          <Button
                            className="w-max rounded-full border border-[#145B10] text-[#145B10] font-bold bg-transparent hover:bg-[#145B10] hover:text-white py-1 sm:py-1.5 text-xs sm:text-sm"
                            onClick={() => openReviewModal(order.id)}
                          >
                            Give Feedback
                          </Button>
                        )}
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