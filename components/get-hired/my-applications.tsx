'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import jobsService, { JobApplication } from '@/services/jobs-service';
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Banknote,
  CalendarDays,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import type { RootState } from '@/store';
import { getApiErrorStatus } from '@/lib/error-handler';

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; chip: string }> = {
  PENDING:   { label: 'Under Review', icon: <Clock className="w-3 h-3" />,        chip: 'bg-amber-50 text-amber-700' },
  ACCEPTED:  { label: 'Offer Received', icon: <CheckCircle2 className="w-3 h-3" />, chip: 'bg-green-50 text-brand' },
  REJECTED:  { label: 'Not Selected', icon: <XCircle className="w-3 h-3" />,      chip: 'bg-red-50 text-red-600'     },
  WITHDRAWN: { label: 'Withdrawn',    icon: <XCircle className="w-3 h-3" />,      chip: 'bg-gray-50 text-gray-600'   },
};

export const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: RootState) => state.auth.user);
  const hasWorkerRole = Boolean(user?.isProvider);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        if (!hasWorkerRole) {
          toast.error('Only workers can view applications');
          setApplications([]);
          return;
        }
        const data = await jobsService.getMyApplications();
        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        if (getApiErrorStatus(err) === 403) {
          toast.error('You must have the worker role to view applications');
        } else {
          toast.error('Failed to load applications');
        }
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [hasWorkerRole]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
          <Briefcase className="w-7 h-7 text-gray-300" />
        </div>
        <p className="text-[14px] font-bold text-ink">No applications yet</p>
        <p className="text-[12px] text-ink-muted px-8">
          Apply to custom jobs on the home screen to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      {applications.map((app) => {
        const meta = STATUS_META[app.status] || STATUS_META.PENDING;
        const job = app.job;

        return (
          <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-brand bg-green-50 rounded-full px-2 py-0.5">
                  {job?.category?.name || 'Service'}
                </span>
                <h3 className="text-[14px] font-bold text-ink leading-snug">
                  {job?.title}
                </h3>
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.chip}`}>
                {meta.icon}{meta.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-muted mt-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {job?.address?.city || 'Kigali'}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3 flex-shrink-0" />
                {job?.startDate ? new Date(job.startDate).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' }) : 'Flexible'}
              </span>
              {job?.budgetMin && (
                <span className="flex items-center gap-1 text-brand font-semibold">
                  <Banknote className="w-3 h-3 flex-shrink-0" />
                  {formatPrice(job.budgetMin, job.budgetMax)}
                </span>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                Applied {new Date(app.createdAt).toLocaleDateString()}
              </span>
              {app.status === 'ACCEPTED' && (
                <button 
                  onClick={() => {
                    window.location.href = app.bookingId
                      ? `/conversations/inbox/${app.bookingId}`
                      : "/conversations";
                  }}
                  className="text-[11px] font-bold text-brand bg-surface px-3 py-1.5 rounded-lg"
                >
                  Review Offer
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
