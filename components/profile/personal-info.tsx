"use client";

import { Users, Mail, Heart, Clock, GraduationCap, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { profileOptionLabel } from "@/constant/profile-options";

export interface PersonalInfoProps {
  gender?: string;
  email?: string;
  healthStatus?: string;
  preferredWorkTime?: string;
  educationLevel?: string;
}

const Row: React.FC<{ icon: LucideIcon; label: string; value?: string }> = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-sm text-ink">
        <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <span>{label}</span>
      </div>
      <span className="text-sm text-ink text-right">{value}</span>
    </div>
  );
};

export function PersonalInfo({
  gender,
  email,
  healthStatus,
  preferredWorkTime,
  educationLevel,
}: PersonalInfoProps) {
  const t = useTranslations("handleProfile");
  const to = useTranslations("profileOptions");
  // Home Location is intentionally omitted here — the profile header already
  // shows the same location, and repeating it (with country appended) read as
  // a duplicate.
  const rows = [
    { icon: Users, label: t("genderLabel"), value: profileOptionLabel("gender", gender, to) },
    { icon: Mail, label: t("emailLabel"), value: email },
    { icon: GraduationCap, label: t("educationLabel"), value: profileOptionLabel("education", educationLevel, to) },
    { icon: Heart, label: t("healthStatusLabel"), value: profileOptionLabel("health", healthStatus, to) },
    { icon: Clock, label: t("preferredWorkTimeLabel"), value: profileOptionLabel("workTime", preferredWorkTime, to) },
  ].filter((r) => !!r.value);

  if (rows.length === 0) return null;

  return (
    <section className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h2 className="text-lg font-bold text-ink mb-4">{t("personalInformation")}</h2>
      <div className="space-y-3">
        {rows.map((r) => (
          <Row key={r.label} icon={r.icon} label={r.label} value={r.value} />
        ))}
      </div>
    </section>
  );
}
