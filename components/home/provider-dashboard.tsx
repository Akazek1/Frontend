"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import api from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { colors } from "@/constant/colors";
import {
  Briefcase,
  Star,
  ClipboardList,
  UserCheck,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

interface Booking {
  id: string;
  service: { title: string; serviceImage: string };
  receiver: { firstName: string; lastName: string; profilePicture: string };
  status: string;
  scheduledFor: string;
  price: number;
}

const getStatusStyle = (): Record<string, { icon: React.ReactNode; style: { color: string }; bg: string }> => ({
  PENDING:   { icon: <Clock className="w-3 h-3" />,        style: { color: "#F59E0B" },  bg: "bg-amber-50"  },
  ACCEPTED:  { icon: <CheckCircle2 className="w-3 h-3" />, style: { color: colors.primary },     bg: "bg-green-50"  },
  COMPLETED: { icon: <CheckCircle2 className="w-3 h-3" />, style: { color: "#2563EB" },   bg: "bg-blue-50"   },
  CANCELLED: { icon: <XCircle className="w-3 h-3" />,      style: { color: "#EF4444" },    bg: "bg-red-50"    },
});

const ProviderDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings/received", { withCredentials: true })
      .then((r) => setBookings(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const total     = bookings.length;
  const pending   = bookings.filter((b) => b.status === "PENDING").length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const earnings  = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((s, b) => s + (b.price || 0), 0);

  const recent = bookings.slice(0, 5);
  const STATUS_STYLE = getStatusStyle();

  return (
    <div className="space-y-4 pb-8">

      {/* Welcome strip */}
      <div className="flex items-center gap-3 rounded-2xl px-4 py-4 text-white" style={{ backgroundColor: colors.primary }}>
        <div className="flex-1">
          <p className="text-[11px] font-medium opacity-80">Provider Dashboard</p>
          <h2 className="text-[16px] font-bold leading-snug mt-0.5">
            Welcome back,{" "}
            <span className="capitalize">{user?.firstName || "Provider"}</span> 👋
          </h2>
          <p className="text-[11px] opacity-70 mt-0.5">Here&apos;s your activity at a glance.</p>
        </div>
        {user?.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt="profile"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/40 flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-[18px] font-bold">
            {(user?.firstName?.[0] || "P").toUpperCase()}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Jobs",  value: total,     icon: <Briefcase className="w-4 h-4" style={{ color: colors.primary }} /> },
          { label: "Pending",     value: pending,   icon: <Clock className="w-4 h-4 text-amber-500" /> },
          { label: "Completed",   value: completed, icon: <CheckCircle2 className="w-4 h-4 text-blue-500" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">{icon}<span className="text-[10px]" style={{ color: colors.textSecondary }}>{label}</span></div>
            <span className="text-[20px] font-bold" style={{ color: colors.text }}>{loading ? "—" : value}</span>
          </div>
        ))}
      </div>

      {/* Earnings card */}
      <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5" style={{ color: colors.primary }} />
        </div>
        <div className="flex-1">
          <p className="text-[11px]" style={{ color: colors.textSecondary }}>Total Earnings (completed jobs)</p>
          <p className="text-[18px] font-bold" style={{ color: colors.primary }}>
            {loading ? "—" : `RWF ${earnings.toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[12px] font-bold mb-2" style={{ color: colors.text }}>Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Manage My Services",  icon: <ClipboardList className="w-4 h-4" style={{ color: colors.primary }} />, href: "/more/services" },
            { label: "Edit Profile",        icon: <UserCheck className="w-4 h-4" style={{ color: colors.primary }} />,     href: "/profile" },
            { label: "View All Jobs",       icon: <Briefcase className="w-4 h-4" style={{ color: colors.primary }} />,     href: "/jobs" },
            { label: "My Reviews",          icon: <Star className="w-4 h-4" style={{ color: colors.primary }} />,          href: "/more/feedback" },
          ].map(({ label, icon, href }) => (
            <Link key={label} href={href}>
              <div className="bg-white border border-gray-100 rounded-2xl px-3 py-3 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colors.primary}15` }}>
                  {icon}
                </div>
                <span className="text-[12px] font-semibold leading-tight" style={{ color: colors.text }}>{label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent received jobs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-bold" style={{ color: colors.text }}>Recent Jobs</p>
          <button
            onClick={() => router.push("/jobs")}
            className="text-[11px] font-semibold"
            style={{ color: colors.primary }}
          >
            See all
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.primary }} />
          </div>
        ) : recent.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
            <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] font-semibold" style={{ color: colors.text }}>No bookings yet</p>
            <p className="text-[11px] mt-1" style={{ color: colors.textSecondary }}>
              Complete your profile and add a service so employers can find you.
            </p>
            <Link href="/more/services">
              <button className="mt-3 text-white text-[11px] font-semibold px-4 py-2 rounded-xl transition-colors" style={{ backgroundColor: colors.primary }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.primaryActive)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}>
                Set Up My Service
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((b) => {
              const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.PENDING;
              return (
                <div
                  key={b.id}
                  onClick={() => router.push(`/received-bookings/${b.id}`)}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3 items-center cursor-pointer hover:shadow-md transition-shadow"
                >
                  <Image
                    src={b.service?.serviceImage || "/default-service.svg"}
                    alt={b.service?.title}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/default-service.svg"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate capitalize" style={{ color: colors.text }}>{b.service?.title}</p>
                    <p className="text-[11px] truncate" style={{ color: colors.textSecondary }}>
                      {b.receiver?.firstName} {b.receiver?.lastName}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(b.scheduledFor).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg}`} style={s.style}>
                      {s.icon}{b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: colors.primary }}>
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
  );
};

export default ProviderDashboard;
