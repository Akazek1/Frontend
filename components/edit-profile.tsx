"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  AtSign,
  BookOpen,
  Check,
  GraduationCap,
  Languages,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import { AppDispatch, RootState } from "@/store";
import { updateUser } from "@/store/slices/auth-slice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ProfileImageUploader from "@/components/profile/profile-img-uloader";
import APP_CONFIG from "@/constant/app.config";
import { QUALITY_DEFS, QUALITY_KEYS, type QualityKey } from "@/constant/user-qualities";

type ProfileForm = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  languages: string[];
  bio: string;
  educationLevel: string;
  healthStatus: string;
  preferredWorkTime: string;
  topQualities: string[];
  city: string;
  district: string;
  sector: string;
};

type Errors = Partial<Record<keyof ProfileForm | "form", string>>;

const EDUCATION_OPTIONS = [
  "No formal education",
  "Primary school",
  "Lower secondary",
  "Upper secondary / high school",
  "Vocational / TVET",
  "University",
  "Other",
];

const WORK_TIME_OPTIONS = [
  "Morning",
  "Afternoon",
  "Evening",
  "Full day",
  "Live-in",
  "Flexible",
];

const HEALTH_OPTIONS = [
  "Fit for work",
  "Can do light work",
  "Prefer not to say",
];

const normalizePhone = (phone?: string) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("250")) return digits;
  return `250${digits}`;
};

const displayLocalPhone = (phone?: string) => normalizePhone(phone).replace(/^250/, "");

const toDateInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const Section = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg border border-[#E8F1E5] bg-white p-4 shadow-sm">
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF8EA] text-[#145B10]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold leading-5 text-[#1B2431]">{title}</h2>
        {description ? (
          <p className="mt-1 text-[12px] leading-5 text-[#6B7668]">{description}</p>
        ) : null}
      </div>
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const Field = ({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <Label className="text-[12px] font-bold text-[#616161]">{label}</Label>
    {children}
    {hint ? <p className="text-[11px] leading-4 text-[#6B7668]">{hint}</p> : null}
    {error ? <p className="text-[11px] font-semibold text-red-500">{error}</p> : null}
  </div>
);

const inputClass =
  "h-12 rounded-lg border-[#E8F1E5] bg-[#FAFCF9] text-[14px] font-semibold text-[#1B2431] focus-visible:ring-[#145B10]/20";

const selectClass =
  "h-12 rounded-lg border-[#E8F1E5] bg-[#FAFCF9] text-[14px] font-semibold text-[#1B2431] focus:ring-[#145B10]/20";

export default function EditProfile({ idEditable = true }: { idEditable?: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [form, setForm] = useState<ProfileForm>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    email: user?.email || "",
    dateOfBirth: toDateInput(user?.dateOfBirth),
    gender: user?.gender || "",
    phoneNumber: displayLocalPhone(user?.phoneNumber),
    languages: user?.languages || [],
    bio: user?.bio || "",
    educationLevel: user?.educationLevel || "",
    healthStatus: user?.healthStatus || "",
    preferredWorkTime: user?.preferredWorkTime || "",
    topQualities: user?.topQualities || [],
    city: "",
    district: "",
    sector: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialLocation, setInitialLocation] = useState({ city: "", district: "", sector: "" });

  const canEdit = idEditable && !saving;

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to edit your profile");
      router.push("/onboarding");
    }
  }, [router, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!user) return;
      try {
        setLoading(true);
        const response = await api.get("/users/profile");
        const data = response.data?.data || response.data || {};
        if (cancelled) return;
        const location = {
          city: data.addresses?.[0]?.city || "",
          district: data.addresses?.[0]?.district || "",
          sector: data.addresses?.[0]?.sector || "",
        };
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: data.username || "",
          email: data.email || "",
          dateOfBirth: toDateInput(data.dateOfBirth),
          gender: data.gender || "",
          phoneNumber: displayLocalPhone(data.phoneNumber),
          languages: Array.isArray(data.languages) ? data.languages : [],
          bio: data.bio || "",
          educationLevel: data.educationLevel || "",
          healthStatus: data.healthStatus || "",
          preferredWorkTime: data.preferredWorkTime || "",
          topQualities: Array.isArray(data.topQualities) ? data.topQualities : [],
          city: location.city,
          district: location.district,
          sector: location.sector,
        });
        setInitialLocation(location);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const profileUrl = useMemo(() => {
    if (!form.username || typeof window === "undefined") return "";
    return `${window.location.origin}/${form.username}`;
  }, [form.username]);

  const setField = useCallback(<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  }, []);

  const toggleLanguage = (language: string) => {
    setField(
      "languages",
      form.languages.includes(language)
        ? form.languages.filter((item) => item !== language)
        : [...form.languages, language],
    );
  };

  const toggleQuality = (quality: QualityKey) => {
    const selected = form.topQualities.includes(quality);
    if (!selected && form.topQualities.length >= 3) {
      toast.error("Choose up to 3 qualities");
      return;
    }
    setField(
      "topQualities",
      selected
        ? form.topQualities.filter((item) => item !== quality)
        : [...form.topQualities, quality],
    );
  };

  const validate = () => {
    const next: Errors = {};
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.email.trim()) next.email = "Email is required";
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email.trim())) {
      next.email = "Enter a valid email";
    }
    if (!form.gender) next.gender = "Gender is required";
    if (!form.dateOfBirth) next.dateOfBirth = "Date of birth is required";
    if (form.dateOfBirth && Number.isNaN(new Date(form.dateOfBirth).getTime())) {
      next.dateOfBirth = "Enter a valid date";
    }
    if (form.languages.length === 0) next.languages = "Choose at least one language";
    if (form.username && !/^[a-z0-9_-]{3,30}$/.test(form.username)) {
      next.username = "Use 3-30 lowercase letters, numbers, underscores, or hyphens";
    }
    if (form.bio.length > 500) next.bio = "Keep your bio under 500 characters";
    if ((form.district.trim() || form.sector.trim()) && !form.city.trim()) {
      next.city = "City is required when adding a location";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!idEditable) return;
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      const username = form.username.trim() || undefined;
      if (username && username !== user?.username) {
        const check = await api.get(`/users/username/${username}/check`);
        if (!check.data?.available) {
          setErrors((prev) => ({ ...prev, username: "Username is already taken" }));
          toast.error("Username is already taken");
          setSaving(false);
          return;
        }
      }

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username,
        email: form.email.trim(),
        gender: form.gender,
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        languages: form.languages,
        bio: form.bio.trim(),
        educationLevel: form.educationLevel || undefined,
        healthStatus: form.healthStatus || undefined,
        preferredWorkTime: form.preferredWorkTime || undefined,
        topQualities: form.topQualities,
      };

      const response = await api.patch("/users/profile", payload);
      const updated = response.data?.data || response.data;

      const nextLocation = {
        city: form.city.trim(),
        district: form.district.trim(),
        sector: form.sector.trim(),
      };
      const locationChanged =
        nextLocation.city !== initialLocation.city ||
        nextLocation.district !== initialLocation.district ||
        nextLocation.sector !== initialLocation.sector;

      if (nextLocation.city && locationChanged) {
        await api.post("/users/addresses", {
          city: nextLocation.city,
          district: nextLocation.district || undefined,
          sector: nextLocation.sector || undefined,
          isDefault: true,
        });
        setInitialLocation(nextLocation);
      }

      dispatch(updateUser({
        id: updated.id,
        username: updated.username,
        phoneNumber: updated.phoneNumber,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        gender: updated.gender,
        dateOfBirth: updated.dateOfBirth,
        languages: updated.languages,
        bio: updated.bio,
        educationLevel: updated.educationLevel,
        healthStatus: updated.healthStatus,
        preferredWorkTime: updated.preferredWorkTime,
        topQualities: updated.topQualities,
        profilePicture: updated.profilePicture,
      }));

      toast.success("Profile updated");
      router.push("/more");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update profile";
      setErrors((prev) => ({ ...prev, form: message }));
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1FCEF]">
        <Loader2 className="h-6 w-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1FCEF] pb-28">
      <div className="sticky top-0 z-20 border-b border-[#E8F1E5] bg-[#F1FCEF]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {idEditable ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1B2431] shadow-sm"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-black text-[#1B2431]">
              {idEditable ? "Edit Profile" : "Profile Preview"}
            </h1>
            <p className="truncate text-[12px] font-medium text-[#6B7668]">
              Keep your public details accurate and trustworthy.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {errors.form ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">
            {errors.form}
          </div>
        ) : null}

        {idEditable ? (
          <Section
            icon={ShieldCheck}
            title="Profile photo"
            description="A clear photo helps employers recognize and trust you."
          >
            <ProfileImageUploader />
          </Section>
        ) : null}

        <Section icon={User} title="Identity">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="First name" error={errors.firstName}>
              <Input
                value={form.firstName}
                disabled={!canEdit}
                onChange={(event) => setField("firstName", event.target.value)}
                className={inputClass}
                placeholder="First name"
              />
            </Field>
            <Field label="Last name">
              <Input
                value={form.lastName}
                disabled={!canEdit}
                onChange={(event) => setField("lastName", event.target.value)}
                className={inputClass}
                placeholder="Last name"
              />
            </Field>
          </div>

          <Field label="Username" error={errors.username} hint={profileUrl ? `Profile link: ${profileUrl}` : undefined}>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7668]" />
              <Input
                value={form.username}
                disabled={!canEdit}
                onChange={(event) =>
                  setField("username", event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                }
                className={`${inputClass} pl-9`}
                placeholder="your-name"
                maxLength={30}
              />
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Gender" error={errors.gender}>
              <Select value={form.gender} onValueChange={(value) => setField("gender", value)} disabled={!canEdit}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {APP_CONFIG.profile.genders.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date of birth" error={errors.dateOfBirth}>
              <Input
                type="date"
                value={form.dateOfBirth}
                disabled={!canEdit}
                onChange={(event) => setField("dateOfBirth", event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section
          icon={Phone}
          title="Contact"
          description="Your phone number is locked after signup for account safety."
        >
          <Field label="Phone number">
            <div className="flex h-12 overflow-hidden rounded-lg border border-[#E8F1E5] bg-gray-100">
              <span className="flex items-center gap-2 border-r border-[#E8F1E5] bg-white px-3 text-[13px] font-bold text-[#1B2431]">
                +250
              </span>
              <div className="relative min-w-0 flex-1">
                <Input
                  value={form.phoneNumber}
                  readOnly
                  disabled
                  className="h-full rounded-none border-0 bg-gray-100 pr-10 text-[14px] font-bold text-[#616161]"
                />
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7668]" />
              </div>
            </div>
          </Field>
          <Field label="Email" error={errors.email}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7668]" />
              <Input
                type="email"
                value={form.email}
                disabled={!canEdit}
                onChange={(event) => setField("email", event.target.value)}
                className={`${inputClass} pl-9`}
                placeholder="you@example.com"
              />
            </div>
          </Field>
        </Section>

        <Section icon={MapPin} title="Location" description="Show employers the general area where you are based.">
          <Field label="City" error={errors.city}>
            <Input
              value={form.city}
              disabled={!canEdit}
              onChange={(event) => setField("city", event.target.value)}
              className={inputClass}
              placeholder="Kigali"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="District">
              <Input
                value={form.district}
                disabled={!canEdit}
                onChange={(event) => setField("district", event.target.value)}
                className={inputClass}
                placeholder="Gasabo"
              />
            </Field>
            <Field label="Sector">
              <Input
                value={form.sector}
                disabled={!canEdit}
                onChange={(event) => setField("sector", event.target.value)}
                className={inputClass}
                placeholder="Kimironko"
              />
            </Field>
          </div>
        </Section>

        <Section
          icon={BookOpen}
          title="About your work"
          description="Employers use this to understand your background before hiring."
        >
          <Field label="Bio" error={errors.bio} hint={`${form.bio.length}/500 characters`}>
            <Textarea
              value={form.bio}
              disabled={!canEdit}
              onChange={(event) => setField("bio", event.target.value.slice(0, 500))}
              className="min-h-[120px] resize-none rounded-lg border-[#E8F1E5] bg-[#FAFCF9] text-[14px] font-medium leading-6 text-[#1B2431] focus-visible:ring-[#145B10]/20"
              placeholder="Tell employers about your experience, strengths, and the kind of work you do best."
            />
          </Field>

          <Field label="Education">
            <Select
              value={form.educationLevel}
              onValueChange={(value) => setField("educationLevel", value)}
              disabled={!canEdit}
            >
              <SelectTrigger className={selectClass}>
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-4 text-[#6B7668]">
              <GraduationCap className="h-3.5 w-3.5" />
              Self-reported. No school document is required.
            </p>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Health / work capacity">
              <Select
                value={form.healthStatus}
                onValueChange={(value) => setField("healthStatus", value)}
                disabled={!canEdit}
              >
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preferred work time">
              <Select
                value={form.preferredWorkTime}
                onValueChange={(value) => setField("preferredWorkTime", value)}
                disabled={!canEdit}
              >
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TIME_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <Section icon={Languages} title="Languages" description="Choose every language you can comfortably use with clients.">
          <div className="grid grid-cols-2 gap-2">
            {APP_CONFIG.profile.languages.map((language) => {
              const active = form.languages.includes(language);
              return (
                <button
                  key={language}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => toggleLanguage(language)}
                  className={`flex h-11 items-center justify-between rounded-lg border px-3 text-left text-[13px] font-bold transition ${
                    active
                      ? "border-[#145B10] bg-[#EEF8EA] text-[#145B10]"
                      : "border-[#E8F1E5] bg-[#FAFCF9] text-[#1B2431]"
                  } disabled:opacity-60`}
                >
                  {language}
                  {active ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
          {errors.languages ? <p className="text-[11px] font-semibold text-red-500">{errors.languages}</p> : null}
        </Section>

        <Section icon={Sparkles} title="Why clients choose you" description="Pick up to 3 qualities to highlight on your public profile.">
          <div className="grid grid-cols-1 gap-2">
            {QUALITY_KEYS.map((quality) => {
              const def = QUALITY_DEFS[quality];
              const Icon = def.icon;
              const active = form.topQualities.includes(quality);
              return (
                <button
                  key={quality}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => toggleQuality(quality)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                    active
                      ? "border-[#145B10] bg-[#EEF8EA]"
                      : "border-[#E8F1E5] bg-[#FAFCF9]"
                  } disabled:opacity-60`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-[#145B10] text-white" : "bg-white text-[#145B10]"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-black text-[#1B2431]">{def.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-[#6B7668]">{def.description}</span>
                  </span>
                  {active ? <Check className="mt-1 h-4 w-4 shrink-0 text-[#145B10]" /> : null}
                </button>
              );
            })}
          </div>
        </Section>

        {idEditable ? (
          <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[428px] border-t border-[#E8F1E5] bg-white p-4">
            <Button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-lg bg-[#145B10] text-[15px] font-black text-white hover:bg-[#0F4D0C]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
