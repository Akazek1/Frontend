'use client';

import React, { useState, useEffect } from 'react';
import BackButtonHeader from '@/components/header/back-button-header';
import {
  Loader2, MessageCircleMore, Star, MapPin, CalendarDays,
  Banknote, ClipboardList, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledFor: string;
  price?: number;
  service: {
    id: string;
    title: string;
    serviceImage?: string;
  };
  worker: { id: string; firstName: string; lastName: string } | null;
  address?: { city?: string; street?: string };
  review: null | { rating: number; comment: string };
}

type Tab = 'All' | 'Upcoming' | 'Completed' | 'Cancelled';

const TABS: Tab[] = ['All', 'Upcoming', 'Completed', 'Cancelled'];

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; chip: string }> = {
  PENDING:     { label: 'Pending',     icon: <Clock className="w-3 h-3" />,        chip: 'bg-amber-50 text-amber-700' },
  CONFIRMED:   { label: 'Confirmed',   icon: <CheckCircle2 className="w-3 h-3" />, chip: 'bg-green-50 text-[#145B10]' },
  IN_PROGRESS: { label: 'In Progress', icon: <CheckCircle2 className="w-3 h-3" />, chip: 'bg-blue-50 text-blue-700'   },
  COMPLETED:   { label: 'Completed',   icon: <CheckCircle2 className="w-3 h-3" />, chip: 'bg-green-50 text-[#145B10]' },
  CANCELLED:   { label: 'Cancelled',   icon: <XCircle className="w-3 h-3" />,      chip: 'bg-red-50 text-red-600'     },
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-RW', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

const EmployerBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<Tab>('All');

  // Review modal state
  const [reviewOpen, setReviewOpen]         = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [rating, setRating]                 = useState(0);
  const [comment, setComment]               = useState('');
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    api.get<{ data: Booking[] }>('/bookings')
      .then((r) => {
        setBookings(Array.isArray(r.data.data) ? r.data.data : []);
        setError(null);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || 'Failed to load bookings';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    if (tab === 'All')       return true;
    if (tab === 'Upcoming')  return ['PENDING','CONFIRMED','IN_PROGRESS'].includes(b.status);
    if (tab === 'Completed') return b.status === 'COMPLETED';
    if (tab === 'Cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const counts: Record<Tab, number> = {
    All:       bookings.length,
    Upcoming:  bookings.filter((b) => ['PENDING','CONFIRMED','IN_PROGRESS'].includes(b.status)).length,
    Completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    Cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  const openReview = (id: string) => {
    setReviewBookingId(id); setRating(0); setComment(''); setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewBookingId || rating < 1 || !comment.trim()) {
      toast.error('Choose a star rating and write a comment.'); return;
    }
    setSubmitting(true);
    try {
      await api.post(`/bookings/${reviewBookingId}/reviews`, { rating, comment });
      toast.success('Review submitted!');
      setBookings((prev) =>
        prev.map((b) => b.id === reviewBookingId ? { ...b, review: { rating, comment } } : b)
      );
      setReviewOpen(false);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not submit review');
    } finally { setSubmitting(false); }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[#F1FCEF] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1FCEF] pb-24">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F1FCEF] px-4 pt-4 pb-3 shadow-sm space-y-3">
        <BackButtonHeader text="My Bookings" backHref="/" />

        {/* Tab chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                tab === t
                  ? 'bg-[#145B10] text-white'
                  : 'bg-white text-[#616161] border border-gray-200'
              }`}
            >
              {t}
              {counts[t] > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Review modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="w-[90vw] max-w-[360px] bg-white rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-[#1B2431]">Leave a Review</DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-[#616161] -mt-2">How was the service?</p>
          <div className="flex gap-1.5 my-1">
            {[1,2,3,4,5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                <Star className={`w-8 h-8 transition-colors ${
                  s <= rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'
                }`} />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked or what could be better…"
            className="border-gray-200 rounded-xl text-[13px] resize-none focus:ring-[#145B10]"
            rows={4}
          />
          <Button
            onClick={submitReview}
            disabled={submitting}
            className="w-full rounded-full bg-[#145B10] hover:bg-[#0f4a0c] text-white font-bold"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : 'Submit Review'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Booking list */}
      <div className="px-4 pt-3 space-y-3">
        {error ? (
          <p className="text-center text-red-500 py-8 text-[13px]">{error}</p>
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          filtered.map((b) => {
            const meta   = STATUS_META[b.status] ?? STATUS_META.PENDING;
            const worker = b.worker ? `${b.worker.firstName} ${b.worker.lastName}` : 'Agency Worker';
            const location = b.address?.city || b.address?.street || null;
            const isUpcoming   = ['PENDING','CONFIRMED','IN_PROGRESS'].includes(b.status);
            const isCompleted  = b.status === 'COMPLETED';
            const canMessage   = ['CONFIRMED','IN_PROGRESS'].includes(b.status);
            const hasReview    = !!b.review;

            return (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex gap-3 p-3">
                  {/* Service image */}
                  <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                      src={b.service?.serviceImage || '/default-service.svg'}
                      alt={b.service?.title}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/default-service.svg'; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[13px] font-bold text-[#1B2431] capitalize leading-snug truncate">
                        {b.service?.title}
                      </p>
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${meta.chip}`}>
                        {meta.icon}{meta.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#616161]">
                      {isUpcoming ? `Provider: ${worker}` : `Served by: ${worker}`}
                    </p>

                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#616161] mt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 flex-shrink-0" />
                        {formatDate(b.scheduledFor)}
                      </span>
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {location}
                        </span>
                      )}
                      {b.price ? (
                        <span className="flex items-center gap-1 text-[#145B10] font-semibold">
                          <Banknote className="w-3 h-3 flex-shrink-0" />
                          RWF {b.price.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                {(canMessage || isCompleted) && (
                  <div className="border-t border-gray-100 flex">
                    {canMessage && (
                      <button
                        onClick={() => window.location.href = `/conversations/inbox/${b.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold text-[#145B10] hover:bg-green-50 transition-colors"
                      >
                        <MessageCircleMore className="w-4 h-4" /> Message Provider
                      </button>
                    )}
                    {isCompleted && !hasReview && (
                      <>
                        {canMessage && <div className="w-px bg-gray-100" />}
                        <button
                          onClick={() => openReview(b.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold text-[#145B10] hover:bg-green-50 transition-colors"
                        >
                          <Star className="w-4 h-4" /> Leave Review
                        </button>
                      </>
                    )}
                    {isCompleted && hasReview && (
                      <div className="flex-1 flex items-center justify-center gap-1 py-2.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${
                            s <= (b.review?.rating ?? 0) ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-200'
                          }`} />
                        ))}
                        <span className="text-[11px] text-[#616161] ml-1">Your review</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ tab }: { tab: Tab }) => {
  const messages: Record<Tab, { icon: React.ReactNode; title: string; sub: string }> = {
    All:       { icon: <ClipboardList className="w-8 h-8 text-gray-300" />, title: 'No bookings yet',     sub: "Once you book a service, it'll appear here."           },
    Upcoming:  { icon: <Clock className="w-8 h-8 text-gray-300" />,        title: 'No upcoming bookings', sub: 'Browse services and book one to get started.'          },
    Completed: { icon: <CheckCircle2 className="w-8 h-8 text-gray-300" />, title: 'No completed jobs',    sub: 'Completed bookings and your reviews will show here.'   },
    Cancelled: { icon: <XCircle className="w-8 h-8 text-gray-300" />,      title: 'No cancellations',    sub: "You haven't cancelled any bookings — great!"           },
  };
  const { icon, title, sub } = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      {icon}
      <p className="text-[14px] font-bold text-[#1B2431] mt-1">{title}</p>
      <p className="text-[12px] text-[#616161] px-8 leading-relaxed">{sub}</p>
    </div>
  );
};

export default EmployerBookings;
