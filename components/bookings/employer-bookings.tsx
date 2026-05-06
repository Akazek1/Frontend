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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Address { street: string; city: string; }
interface Worker { id: string; firstName: string; lastName: string; }
interface Service { id: string; title: string; providerId: string; }

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

const getDaySuffix = (day: number) => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${days[d.getDay()]}, ${d.getDate()}${getDaySuffix(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return 'Invalid Date'; }
};

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'PENDING':    return { text: 'Pending',       color: 'bg-amber-500' };
    case 'CONFIRMED':  return { text: 'Confirmed',     color: 'bg-[#145B10]' };
    case 'COMPLETED':  return { text: 'Completed',     color: 'bg-[#145B10]' };
    case 'CANCELLED':  return { text: 'Cancelled',     color: 'bg-red-500' };
    default:           return { text: status,           color: 'bg-gray-500' };
  }
};

const EmployerBookings: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'All'|'Pending'|'Confirmed'|'Completed'|'Cancelled'>('All');

  useEffect(() => {
    api.get<{ data: Booking[] }>('/bookings')
      .then((r) => {
        const bookings = Array.isArray(r.data.data) ? r.data.data : [];
        const grouped = bookings.reduce((acc: Category[], b) => {
          const cat = b.service.title.toUpperCase();
          const order = {
            id: b.id,
            status: b.status,
            provider: b.worker ? `${b.worker.firstName} ${b.worker.lastName}` : 'Agency Worker',
            profession: b.service.title,
            date: formatDate(b.scheduledFor),
            amount: b.price ? `${b.price} RWF` : undefined,
            reviewSubmitted: !!b.review,
            service: b.service,
          };
          const existing = acc.find((c) => c.category === cat);
          if (existing) existing.orders.push(order);
          else acc.push({ category: cat, orders: [order] });
          return acc;
        }, []);
        setCategories(grouped.sort((a, b) => a.category.localeCompare(b.category)));
        setError(null);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || 'Failed to fetch bookings';
        setError(msg);
        toast.error(msg);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const openReviewModal = (id: string) => {
    setSelectedBookingId(id); setRating(0); setComment(''); setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingId || rating < 1 || !comment.trim()) {
      toast.error('Please select a rating and write a comment.'); return;
    }
    setSubmitting(true);
    try {
      await api.post(`/bookings/${selectedBookingId}/reviews`, { rating, comment });
      toast.success('Review submitted!');
      setCategories((prev) => prev.map((c) => ({
        ...c,
        orders: c.orders.map((o) => o.id === selectedBookingId ? { ...o, reviewSubmitted: true } : o),
      })));
      setReviewModalOpen(false);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const filtered = categories
    .map((c) => ({
      ...c,
      orders: c.orders.filter((o) => {
        if (activeTab === 'All') return true;
        return o.status.toLowerCase() === activeTab.toLowerCase();
      }),
    }))
    .filter((c) => c.orders.length > 0);

  if (loading) return (
    <div className="min-h-screen bg-[#F1FCEF] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#F1FCEF] p-4">
      <BackButtonHeader text="Bookings" backHref="/" />
      <p className="text-center text-red-500 py-4">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1FCEF] pb-24">
      <BackButtonHeader text="My Bookings" className="p-3 sm:p-6" backHref="/" />

      {/* Status filter */}
      <div className="px-4 pb-4">
        <div className="bg-white/50 rounded-xl border border-gray-100">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <SelectTrigger className="w-full py-3 text-sm font-semibold text-[#616161] bg-transparent border-none focus:ring-2 focus:ring-[#145B10]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white text-[#616161]">
              {['All','Pending','Confirmed','Completed','Cancelled'].map((t) => (
                <SelectItem key={t} value={t} className="font-semibold">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Review modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="w-[90vw] max-w-[360px] bg-white rounded-3xl p-4">
          <DialogHeader>
            <DialogTitle className="text-[#1B2431] text-lg font-semibold">Submit Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-1">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-7 h-7 ${s <= rating ? 'fill-[#145B10] stroke-[#145B10]' : 'stroke-[#145B10]'}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Write your feedback…" className="border-[#145B10] rounded-xl text-sm" rows={4} />
            <Button className="w-full rounded-full font-bold bg-[#145B10] text-white hover:bg-[#0f4a0c]"
              onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : 'Submit Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking cards */}
      <div className="px-4 pb-10 max-w-2xl mx-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-[#616161] font-medium text-sm py-8">No bookings found.</p>
        ) : (
          filtered.map((cat, i) => (
            <div key={i}>
              <h2 className="py-4 text-lg font-bold text-[#212121] capitalize">{cat.category}</h2>
              <div className="space-y-3">
                {cat.orders.map((order, j) => (
                  <div key={j} className="bg-white shadow-sm p-4 space-y-3 rounded-3xl border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] text-white font-bold py-1 px-2.5 rounded-full ${getStatusDisplay(order.status).color}`}>
                        {getStatusDisplay(order.status).text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-[#616161]">{order.provider}</p>
                        <p className="text-base font-bold text-[#212121] capitalize">{order.profession}</p>
                      </div>
                      <button
                        onClick={() => order.status === 'CONFIRMED' && (window.location.href = `/conversations/inbox/${order.id}`)}
                        disabled={order.status !== 'CONFIRMED' && order.status !== 'IN_PROGRESS'}
                      >
                        <MessageCircleMore className={`w-5 h-5 ${order.status === 'CONFIRMED' ? 'stroke-[#145B10]' : 'stroke-gray-300'}`} />
                      </button>
                    </div>
                    <p className="text-xs text-[#616161]">📅 {order.date}</p>
                    <div className="flex items-center justify-between">
                      {order.status === 'COMPLETED' && order.amount && (
                        <div className="flex items-center gap-1">
                          <CircleCheck className="w-4 h-4 text-[#145B10]" />
                          <p className="text-xs text-[#145B10] font-bold">Paid {order.amount}</p>
                        </div>
                      )}
                      {order.status === 'COMPLETED' && !order.reviewSubmitted && (
                        <Button
                          className="ml-auto rounded-full border border-[#145B10] text-[#145B10] font-bold bg-transparent hover:bg-[#145B10] hover:text-white text-xs py-1"
                          onClick={() => openReviewModal(order.id)}
                        >
                          Give Feedback
                        </Button>
                      )}
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

export default EmployerBookings;
