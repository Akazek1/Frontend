'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Image from 'next/image';
import Link from 'next/link';
import BackButtonHeader from '@/components/header/back-button-header';
import {
  Loader2, CalendarDays, Banknote, Briefcase,
  CheckCircle2, Clock, XCircle, TrendingUp, MessageCircleMore,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  status: string;
  scheduledFor?: string | null;
  price?: number;
  agreedPrice?: number;
  service?: { title: string; serviceImage?: string } | null;
  job?: { title: string } | null;
  receiver?: { username?: string; firstName: string; lastName: string; profilePicture: string };
  employer?: { username?: string; firstName: string; lastName: string; profilePicture: string };
}

type Tab = 'All' | 'Requests' | 'Active' | 'Completed' | 'Cancelled';

const TABS: Tab[] = ['All', 'Requests', 'Active', 'Completed', 'Cancelled'];

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; chip: string }> = {
  PENDING:     { label: 'Offer',       icon: <Clock className="w-3 h-3" />,        chip: 'bg-amber-50 text-amber-700'  },
  CONFIRMED:   { label: 'Confirmed',   icon: <CheckCircle2 className="w-3 h-3" />, chip: 'bg-green-50 text-brand'  },
  IN_PROGRESS: { label: 'In Progress', icon: <CheckCircle2 className="w-3 h-3" />, chip: 'bg-blue-50 text-blue-700'    },
  COMPLETED:   { label: 'Done',        icon: <CheckCircle2 className="w-3 h-3" />, chip: 'bg-green-50 text-brand'  },
  CANCELLED:   { label: 'Cancelled',   icon: <XCircle className="w-3 h-3" />,      chip: 'bg-red-50 text-red-600'      },
  ACCEPTED:    { label: 'Accepted',    icon: <CheckCircle2 className="w-3 h-3" />, chip: 'bg-green-50 text-brand'  },
};

const formatDate = (iso?: string | null) => {
  if (!iso) return 'To agree';
  try {
    return new Date(iso).toLocaleDateString('en-RW', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

const ProviderBookings: React.FC = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null); // booking id being accepted/declined
  const [tab, setTab]           = useState<Tab>('All');

  useEffect(() => {
    api.get('/bookings/received', { withCredentials: true })
      .then((r) => setBookings(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const total    = bookings.length;
  const active   = bookings.filter((b) => ['CONFIRMED','IN_PROGRESS','ACCEPTED'].includes(b.status)).length;
  const earnings = bookings.filter((b) => b.status === 'COMPLETED').reduce((s, b) => s + (b.price || b.agreedPrice || 0), 0);

  const filtered = bookings.filter((b) => {
    if (tab === 'All')       return true;
    if (tab === 'Requests')  return b.status === 'PENDING';
    if (tab === 'Active')    return ['CONFIRMED','IN_PROGRESS','ACCEPTED'].includes(b.status);
    if (tab === 'Completed') return b.status === 'COMPLETED';
    if (tab === 'Cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const counts: Record<Tab, number> = {
    All:       bookings.length,
    Requests:  bookings.filter((b) => b.status === 'PENDING').length,
    Active:    bookings.filter((b) => ['CONFIRMED','IN_PROGRESS','ACCEPTED'].includes(b.status)).length,
    Completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    Cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  const handleAccept = async (id: string) => {
    setActing(id);
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'CONFIRMED' });
      toast.success('Offer accepted. Booking confirmed.');
      // Navigate directly to the chat so both parties land in the conversation
      router.push(`/conversations/inbox/${id}`);
    } catch { toast.error('Could not accept booking.'); }
    finally { setActing(null); }
  };

  const handleDecline = async (id: string) => {
    setActing(id);
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      toast.success('Offer declined.');
    } catch { toast.error('Could not decline booking.'); }
    finally { setActing(null); }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-brand" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface pb-24">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-surface px-4 pt-4 pb-3 shadow-sm space-y-3">
        <BackButtonHeader text="My Jobs" backHref="/" />

        {/* Tab chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                tab === t
                  ? 'bg-brand text-white'
                  : 'bg-white text-ink-muted border border-gray-200'
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

      <div className="px-4 pt-3 space-y-4">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Jobs',   value: total,                          icon: <Briefcase className="w-4 h-4 text-brand" /> },
            { label: 'Active',       value: active,                         icon: <Clock className="w-4 h-4 text-amber-500" />     },
            { label: 'Earned (RWF)', value: earnings.toLocaleString(),      icon: <TrendingUp className="w-4 h-4 text-blue-500" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] text-ink-muted">{label}</span></div>
              <p className="text-[16px] font-bold text-ink leading-tight truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Booking list */}
        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const meta     = STATUS_META[b.status] ?? STATUS_META.PENDING;
              const isPending = b.status === 'PENDING';
              const canMessage = ['PENDING','CONFIRMED','IN_PROGRESS','ACCEPTED'].includes(b.status);
              const isActing   = acting === b.id;
              const title = b.service?.title || b.job?.title || 'Work request';
              const image = b.service?.serviceImage || '/default-service.svg';
              const price = b.price ?? b.agreedPrice;

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="flex gap-3 p-3">
                    {/* Service image */}
                    <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/default-service.svg'; }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[13px] font-bold text-ink capitalize leading-snug truncate">
                          {title}
                        </p>
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${meta.chip}`}>
                          {meta.icon}{meta.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-ink-muted">
                        From:{" "}
                        {(() => {
                          const person = b.employer || b.receiver;
                          if (!person) return null;
                          const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim();
                          if (person.username) {
                            return (
                              <Link
                                href={`/${person.username}`}
                                className="font-semibold text-ink hover:text-brand hover:underline"
                              >
                                {fullName}
                              </Link>
                            );
                          }
                          return <span className="font-semibold text-ink">{fullName}</span>;
                        })()}
                      </p>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-muted mt-0.5">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 flex-shrink-0" />
                          {formatDate(b.scheduledFor)}
                        </span>
                        {price ? (
                          <span className="flex items-center gap-1 text-brand font-semibold">
                            <Banknote className="w-3 h-3 flex-shrink-0" />
                            RWF {price.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Action bar */}
                  {(isPending || canMessage) && (
                    <div className="border-t border-gray-100 flex">
                      {isPending && (
                        <>
                          <button
                            onClick={() => router.push(`/conversations/inbox/${b.id}`)}
                            disabled={isActing}
                            className="flex-1 py-2.5 text-[12px] font-semibold text-brand hover:bg-green-50 transition-colors disabled:opacity-50"
                          >
                            Message
                          </button>
                          <div className="w-px bg-gray-100" />
                          <button
                            onClick={() => handleDecline(b.id)}
                            disabled={isActing}
                            className="flex-1 py-2.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {isActing ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Decline'}
                          </button>
                          <div className="w-px bg-gray-100" />
                          <button
                            onClick={() => handleAccept(b.id)}
                            disabled={isActing}
                            className="flex-1 py-2.5 text-[12px] font-semibold text-brand hover:bg-green-50 transition-colors disabled:opacity-50"
                          >
                            {isActing ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Accept'}
                          </button>
                        </>
                      )}
                      {canMessage && !isPending && (
                        <button
                          onClick={() => router.push(`/conversations/inbox/${b.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold text-brand hover:bg-green-50 transition-colors"
                        >
                          <MessageCircleMore className="w-4 h-4" /> Message Client
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ tab }: { tab: Tab }) => {
  const messages: Record<Tab, { icon: React.ReactNode; title: string; sub: string }> = {
    All:       { icon: <Briefcase className="w-8 h-8 text-gray-300" />,      title: 'No jobs yet',          sub: 'Complete your profile so employers can find and book you.'  },
    Requests:  { icon: <Clock className="w-8 h-8 text-gray-300" />,          title: 'No pending offers',    sub: 'Official offers from employers will appear here.'       },
    Active:    { icon: <CheckCircle2 className="w-8 h-8 text-gray-300" />,   title: 'No active jobs',       sub: 'Jobs you accept will show here while they\'re in progress.' },
    Completed: { icon: <CheckCircle2 className="w-8 h-8 text-gray-300" />,   title: 'No completed jobs',    sub: 'Your finished jobs and earnings will appear here.'           },
    Cancelled: { icon: <XCircle className="w-8 h-8 text-gray-300" />,        title: 'No cancellations',     sub: "You haven't declined or cancelled any bookings."            },
  };
  const { icon, title, sub } = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
      {icon}
      <p className="text-[14px] font-bold text-ink mt-1">{title}</p>
      <p className="text-[12px] text-ink-muted px-8 leading-relaxed">{sub}</p>
    </div>
  );
};

export default ProviderBookings;
