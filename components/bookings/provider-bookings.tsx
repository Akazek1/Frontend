'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/lib/axios';
import Image from 'next/image';
import BackButtonHeader from '@/components/header/back-button-header';
import {
  Briefcase, Star, CheckCircle2, Clock, XCircle, Loader2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Booking {
  id: string;
  service: { title: string; serviceImage: string };
  receiver: { firstName: string; lastName: string; profilePicture: string };
  status: string;
  scheduledFor: string;
  price: number;
}

const STATUS_STYLE: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  PENDING:   { icon: <Clock className="w-3 h-3" />,        color: 'text-amber-600',  bg: 'bg-amber-50',  label: 'Pending'   },
  ACCEPTED:  { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-[#145B10]',  bg: 'bg-green-50',  label: 'Accepted'  },
  CONFIRMED: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-[#145B10]',  bg: 'bg-green-50',  label: 'Confirmed' },
  COMPLETED: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Completed' },
  CANCELLED: { icon: <XCircle className="w-3 h-3" />,      color: 'text-red-500',    bg: 'bg-red-50',    label: 'Cancelled' },
};

const ProviderBookings: React.FC = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    api.get('/bookings/received', { withCredentials: true })
      .then((r) => setBookings(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const total     = bookings.length;
  const pending   = bookings.filter((b) => b.status === 'PENDING').length;
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
  const earnings  = bookings.filter((b) => b.status === 'COMPLETED').reduce((s, b) => s + (b.price || 0), 0);

  const filtered = bookings.filter((b) => activeTab === 'All' || b.status === activeTab.toUpperCase());

  return (
    <div className="min-h-screen bg-[#F1FCEF] pb-24">
      <BackButtonHeader text="My Jobs" className="p-3 sm:p-6" backHref="/" />

      <div className="px-4 space-y-4">

        {/* Welcome strip */}
        <div className="flex items-center gap-3 bg-[#145B10] rounded-2xl px-4 py-4 text-white">
          <div className="flex-1">
            <p className="text-[11px] opacity-75">Provider Overview</p>
            <h2 className="text-[16px] font-bold leading-snug mt-0.5">
              Hi, <span className="capitalize">{user?.firstName || 'Provider'}</span> 👋
            </h2>
          </div>
          {user?.profilePicture ? (
            <Image src={user.profilePicture} alt="profile" width={44} height={44}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/40 flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {(user?.firstName?.[0] || 'P').toUpperCase()}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total',     value: total,     icon: <Briefcase className="w-4 h-4 text-[#145B10]" /> },
            { label: 'Pending',   value: pending,   icon: <Clock className="w-4 h-4 text-amber-500" /> },
            { label: 'Completed', value: completed, icon: <CheckCircle2 className="w-4 h-4 text-blue-500" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">{icon}<span className="text-[10px] text-[#616161]">{label}</span></div>
              <span className="text-[20px] font-bold text-[#1B2431]">{loading ? '—' : value}</span>
            </div>
          ))}
        </div>

        {/* Earnings */}
        <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Star className="w-5 h-5 text-[#145B10]" />
          </div>
          <div>
            <p className="text-[11px] text-[#616161]">Total earnings (completed)</p>
            <p className="text-[17px] font-bold text-[#145B10]">
              {loading ? '—' : `RWF ${earnings.toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Filter + list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold text-[#1B2431]">Received Bookings</p>
            <div className="w-36">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="h-8 text-[11px] font-semibold text-[#616161] border-gray-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All','Pending','Accepted','Confirmed','Completed','Cancelled'].map((t) => (
                    <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#145B10]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-[#1B2431]">No bookings yet</p>
              <p className="text-[11px] text-[#616161] mt-1">
                Complete your profile so employers can find and book you.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((b) => {
                const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.PENDING;
                return (
                  <div
                    key={b.id}
                    onClick={() => router.push(`/received-bookings/${b.id}`)}
                    className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3 items-center cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <Image
                      src={b.service?.serviceImage || '/default-service.svg'}
                      alt={b.service?.title}
                      width={52} height={52}
                      className="w-13 h-13 rounded-xl object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/default-service.svg'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#1B2431] truncate capitalize">{b.service?.title}</p>
                      <p className="text-[11px] text-[#616161] truncate">
                        From: {b.receiver?.firstName} {b.receiver?.lastName}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(b.scheduledFor).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                        {s.icon}{s.label}
                      </span>
                      <span className="text-[11px] font-bold text-[#145B10]">
                        RWF {(b.price || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderBookings;
