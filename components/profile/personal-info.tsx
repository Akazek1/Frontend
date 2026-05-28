"use client";

import { User, Users, Mail, Home, Heart, Clock, GraduationCap, type LucideIcon } from "lucide-react";

export interface PersonalInfoProps {
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  homeLocation?: string;
  healthStatus?: string;
  preferredWorkTime?: string;
  educationLevel?: string;
}

const formatDob = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const Row: React.FC<{ icon: LucideIcon; label: string; value?: string }> = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-sm text-[#1B2431]">
        <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <span>{label}</span>
      </div>
      <span className="text-sm text-[#1B2431] text-right">{value}</span>
    </div>
  );
};

export function PersonalInfo({
  dateOfBirth,
  gender,
  email,
  homeLocation,
  healthStatus,
  preferredWorkTime,
  educationLevel,
}: PersonalInfoProps) {
  const dob = formatDob(dateOfBirth);
  const formattedGender = gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : undefined;
  const rows = [
    { icon: User, label: "Date of Birth", value: dob },
    { icon: Users, label: "Gender", value: formattedGender },
    { icon: Mail, label: "Email", value: email },
    { icon: Home, label: "Home Location", value: homeLocation },
    { icon: GraduationCap, label: "Education", value: educationLevel },
    { icon: Heart, label: "Health Status", value: healthStatus },
    { icon: Clock, label: "Preferred Work Time", value: preferredWorkTime },
  ].filter((r) => !!r.value);

  if (rows.length === 0) return null;

  return (
    <section className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h2 className="text-lg font-bold text-[#1B2431] mb-4">Personal Information</h2>
      <div className="space-y-3">
        {rows.map((r) => (
          <Row key={r.label} icon={r.icon} label={r.label} value={r.value} />
        ))}
      </div>
    </section>
  );
}
