"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  AtSign,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileBadge,
  GraduationCap,
  IdCard,
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
import {
  appCardClass,
  appInputClass,
  appPrimaryButtonClass,
  appTextareaClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";
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
type EditSection = "overview" | "identity" | "location" | "languages" | "work" | "trust";

const LEGAL_WORKING_AGE = 18;
const BIO_LIMIT = 500;

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

const getMaxBirthDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - LEGAL_WORKING_AGE);
  return date.toISOString().slice(0, 10);
};

const getAge = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
};

const fullName = (form: ProfileForm) =>
  [form.firstName, form.lastName].filter(Boolean).join(" ").trim() || "Your profile";

const inputClass =
  appInputClass;

const selectClass =
  appInputClass;

const SectionShell = ({
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
  <section className={appCardClass}>
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF8EA] text-[#145B10]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-[16px] font-black leading-5 text-[#1B2431]">{title}</h2>
        {description ? <p className="mt-1 text-[12px] leading-5 text-[#53604F]">{description}</p> : null}
      </div>
    </div>
    <div className="space-y-4">{children}</div>
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
  <div className="space-y-1.5">
    <Label className="text-[12px] font-black text-[#374033]">{label}</Label>
    {children}
    {hint ? <p className="text-[11px] leading-4 text-[#6B7668]">{hint}</p> : null}
    {error ? <p className="text-[11px] font-semibold text-red-500">{error}</p> : null}
  </div>
);

export default function EditProfile({ idEditable = true }: { idEditable?: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeSection, setActiveSection] = useState<EditSection>("overview");
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
  const maxBirthDate = useMemo(getMaxBirthDate, []);

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

  const profileCompletion = useMemo(() => {
    const checks = [
      form.firstName.trim(),
      form.lastName.trim(),
      form.gender,
      form.dateOfBirth,
      form.phoneNumber,
      form.languages.length > 0,
      form.bio.trim(),
      form.city.trim(),
      form.educationLevel,
      form.preferredWorkTime,
      form.topQualities.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const profileCompletionMessage = useMemo(() => {
    if (profileCompletion === 100) return "Your profile is complete and ready for employers.";
    if (profileCompletion >= 85) return "Almost there. Complete a few more sections.";
    return "Add more details to help employers decide faster.";
  }, [profileCompletion]);

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
    const age = form.dateOfBirth ? getAge(form.dateOfBirth) : null;

    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email.trim())) {
      next.email = "Enter a valid email";
    }
    if (!form.gender) next.gender = "Gender is required";
    if (!form.dateOfBirth) next.dateOfBirth = "Date of birth is required";
    if (form.dateOfBirth && Number.isNaN(new Date(form.dateOfBirth).getTime())) {
      next.dateOfBirth = "Enter a valid date";
    }
    if (age !== null && age < LEGAL_WORKING_AGE) {
      next.dateOfBirth = `You must be at least ${LEGAL_WORKING_AGE} to work in Rwanda`;
    }
    if (form.languages.length === 0) next.languages = "Choose at least one language";
    if (form.username && !/^[a-z0-9_-]{3,30}$/.test(form.username)) {
      next.username = "Use 3-30 lowercase letters, numbers, underscores, or hyphens";
    }
    if (form.bio.length > BIO_LIMIT) next.bio = `Keep your bio under ${BIO_LIMIT} characters`;
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
          setActiveSection("identity");
          return;
        }
      }

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
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
      setActiveSection("overview");
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

  const openSection = (section: EditSection) => {
    setErrors((prev) => ({ ...prev, form: undefined }));
    setActiveSection(section);
  };

  const sectionTitle = {
    overview: idEditable ? "Edit Profile" : "Profile Preview",
    identity: "Identity",
    location: "Location",
    languages: "Languages",
    work: "About your work",
    trust: "Verification & trust",
  }[activeSection];

  const sectionDescription = {
    overview: "Keep your details accurate and build trust.",
    identity: "",
    location: "Set the areas where you are available for work.",
    languages: "Choose all languages you can comfortably use.",
    work: "Tell employers what makes you reliable and professional.",
    trust: "Complete checks that help employers hire with confidence.",
  }[activeSection];

  if (loading) {
    return (
      <div className="app-bg flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  const Header = (
    <div className="app-bg sticky top-0 z-20 border-b border-[#E1EBDD] px-4 pb-3 pt-6 backdrop-blur">
      <div className="mx-auto flex max-w-[428px] items-center gap-3">
        <button
          type="button"
          onClick={() => (activeSection === "overview" ? router.back() : openSection("overview"))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1B2431] shadow-sm hover:bg-[#E8F7E5]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-black leading-7 text-[#1B2431]">{sectionTitle}</h1>
          {sectionDescription && (
            <p className="line-clamp-2 text-[12px] font-medium leading-5 text-[#53604F]">
              {sectionDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const SaveBar = idEditable ? (
    <div className="fixed bottom-14 left-0 right-0 z-30 mx-auto max-w-[428px] border-t border-[#E1EBDD] bg-white p-4">
      <Button
        type="submit"
        disabled={saving}
        className={cn(appPrimaryButtonClass, "w-full")}
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save changes
      </Button>
    </div>
  ) : null;

  return (
    <div className="app-bg min-h-dvh pb-44">
      {Header}
      <form onSubmit={handleSubmit} className="mx-auto max-w-[428px] space-y-4 px-4 pt-4">
        {errors.form ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">
            {errors.form}
          </div>
        ) : null}

        {activeSection === "overview" ? (
          <>
            <section className={cn(appCardClass, "p-5 text-center")}>
              {idEditable ? (
                <ProfileImageUploader />
              ) : (
                <>
                  <div className="mx-auto mb-3 flex h-28 w-28 items-center justify-center rounded-full bg-[#EEF8EA]">
                    <User className="h-12 w-12 text-[#145B10]" />
                  </div>
                  <h2 className="text-[21px] font-black leading-7 text-[#1B2431]">{fullName(form)}</h2>
                </>
              )}
              <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-black text-[#145B10]">
                <ShieldCheck className="h-4 w-4" />
                Verified phone
              </p>
            </section>

            <section className={appCardClass}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EEF8EA] text-[#145B10]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-black text-[#1B2431]">Profile completeness</p>
                    <p className="text-[13px] font-black text-[#1B2431]">{profileCompletion}%</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#E5E9E3]">
                    <div className="h-full rounded-full bg-[#145B10]" style={{ width: `${profileCompletion}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-[#53604F]">{profileCompletionMessage}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-[17px] font-black text-[#1B2431]">Complete your profile</h2>
              {[
                {
                  key: "identity" as EditSection,
                  icon: IdCard,
                  title: "Identity",
                  subtitle: "Name, date of birth, contact",
                  done: Boolean(form.firstName && form.gender && form.dateOfBirth),
                },
                {
                  key: "location" as EditSection,
                  icon: MapPin,
                  title: "Location",
                  subtitle: "Where you are based",
                  done: Boolean(form.city),
                },
                {
                  key: "languages" as EditSection,
                  icon: Languages,
                  title: "Languages",
                  subtitle: "Languages you can speak",
                  done: form.languages.length > 0,
                },
                {
                  key: "work" as EditSection,
                  icon: BookOpen,
                  title: "About your work",
                  subtitle: "Bio, experience, availability, skills",
                  done: Boolean(form.bio || form.educationLevel || form.preferredWorkTime || form.topQualities.length),
                },
                {
                  key: "trust" as EditSection,
                  icon: ShieldCheck,
                  title: "Verification & trust",
                  subtitle: "Phone, ID, background, insurance",
                  done: Boolean(form.phoneNumber),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openSection(item.key)}
                    className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-[#E1EBDD] bg-white p-3 text-left shadow-sm transition hover:border-[#BFD9BA]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EEF8EA] text-[#145B10]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-black text-[#1B2431]">{item.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[#53604F]">{item.subtitle}</span>
                    </span>
                    {item.done ? <CheckCircle2 className="h-4 w-4 text-[#145B10]" /> : <ChevronRight className="h-5 w-5 text-[#53604F]" />}
                  </button>
                );
              })}
            </section>

            <section className={appCardClass}>
              <h2 className="mb-3 flex items-center gap-2 text-[14px] font-black text-[#1B2431]">
                <ShieldCheck className="h-4 w-4 text-[#145B10]" />
                Why this matters
              </h2>
              {["Build trust with employers", "Increase your chances of being hired", "Help employers find the right match", "Stand out with a complete profile"].map((item) => (
                <p key={item} className="mt-3 flex items-center gap-2 text-[12px] font-medium text-[#374033]">
                  <CheckCircle2 className="h-4 w-4 text-[#145B10]" />
                  {item}
                </p>
              ))}
            </section>

            {profileUrl ? (
              <Button
                type="button"
                onClick={() => router.push(`/${form.username}`)}
                className={cn(appPrimaryButtonClass, "w-full")}
              >
                <Eye className="h-4 w-4" />
                Preview profile
              </Button>
            ) : null}
          </>
        ) : null}

        {activeSection === "identity" ? (
          <SectionShell icon={User} title="Identity" description="Email is optional. Your phone remains the main account contact.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="First name" error={errors.firstName}>
                <Input value={form.firstName} disabled={!canEdit} onChange={(event) => setField("firstName", event.target.value)} className={inputClass} placeholder="First name" />
              </Field>
              <Field label="Last name">
                <Input value={form.lastName} disabled={!canEdit} onChange={(event) => setField("lastName", event.target.value)} className={inputClass} placeholder="Last name" />
              </Field>
            </div>

            <Field label="Username" error={errors.username} hint={profileUrl ? `Profile link: ${profileUrl}` : undefined}>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7668]" />
                <Input
                  value={form.username}
                  disabled={!canEdit}
                  onChange={(event) => setField("username", event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  className={`${inputClass} pl-9`}
                  placeholder="your-name"
                  maxLength={30}
                />
              </div>
            </Field>

            <Field label="Date of birth" error={errors.dateOfBirth} hint={`Workers must be at least ${LEGAL_WORKING_AGE} years old.`}>
              <div className="relative">
                <Input type="date" value={form.dateOfBirth} max={maxBirthDate} disabled={!canEdit} onChange={(event) => setField("dateOfBirth", event.target.value)} className={`${inputClass} pr-10`} />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#53604F]" />
              </div>
            </Field>

            <Field label="Gender" error={errors.gender}>
              <div className="grid grid-cols-3 gap-2">
                {APP_CONFIG.profile.genders.map((gender) => {
                  const active = form.gender === gender.value;
                  return (
                    <button
                      key={gender.value}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setField("gender", gender.value)}
                      className={`flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 text-center text-[12px] font-black transition ${
                        active ? "border-[#145B10] bg-[#EEF8EA] text-[#145B10]" : "border-[#E1EBDD] bg-white text-[#1B2431]"
                      } disabled:opacity-60`}
                    >
                      <User className="h-4 w-4" />
                      {gender.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Phone number">
              <div className="flex h-12 overflow-hidden rounded-xl border border-[#E1EBDD] bg-[#F4F7F2] shadow-sm">
                <span className="flex items-center gap-2 border-r border-[#E1EBDD] bg-white px-3 text-[13px] font-black text-[#1B2431]">+250</span>
                <div className="relative min-w-0 flex-1">
                  <Input value={form.phoneNumber} readOnly disabled className="h-full rounded-none border-0 bg-[#F4F7F2] pr-10 text-[14px] font-black text-[#616161]" />
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7668]" />
                </div>
              </div>
            </Field>

            <Field label="Email (optional)" error={errors.email}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7668]" />
                <Input type="email" value={form.email} disabled={!canEdit} onChange={(event) => setField("email", event.target.value)} className={`${inputClass} pl-9`} placeholder="you@example.com" />
              </div>
            </Field>

            <div className="rounded-lg bg-[#EEF8EA] p-4 text-[12px] font-medium leading-5 text-[#374033]">
              <Lock className="mb-2 h-4 w-4 text-[#145B10]" />
              Your contact information is private and only shared after a booking is confirmed.
            </div>
          </SectionShell>
        ) : null}

        {activeSection === "location" ? (
          <SectionShell icon={MapPin} title="Location" description="Use the general area employers should use for matching.">
            <Field label="City" error={errors.city}>
              <Input value={form.city} disabled={!canEdit} onChange={(event) => setField("city", event.target.value)} className={inputClass} placeholder="Kigali" />
            </Field>
            <Field label="District">
              <Input value={form.district} disabled={!canEdit} onChange={(event) => setField("district", event.target.value)} className={inputClass} placeholder="Kicukiro" />
            </Field>
            <Field label="Sector">
              <Input value={form.sector} disabled={!canEdit} onChange={(event) => setField("sector", event.target.value)} className={inputClass} placeholder="Gatenga" />
            </Field>
          </SectionShell>
        ) : null}

        {activeSection === "languages" ? (
          <SectionShell icon={Languages} title="Languages" description="Choose every language you can comfortably use with clients.">
            <div className="grid grid-cols-1 gap-2">
              {APP_CONFIG.profile.languages.map((language) => {
                const active = form.languages.includes(language);
                return (
                  <button
                    key={language}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleLanguage(language)}
                    className={`flex h-12 items-center justify-between rounded-xl border px-3 text-left text-[13px] font-black transition ${
                      active ? "border-[#145B10] bg-[#EEF8EA] text-[#145B10]" : "border-[#E1EBDD] bg-white text-[#1B2431]"
                    } disabled:opacity-60`}
                  >
                    {language}
                    {active ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })}
            </div>
            {errors.languages ? <p className="text-[11px] font-semibold text-red-500">{errors.languages}</p> : null}
          </SectionShell>
        ) : null}

        {activeSection === "work" ? (
          <>
            <SectionShell icon={BookOpen} title="About your work" description="Keep it practical, specific, and easy for employers to scan.">
              <Field label="Bio" error={errors.bio} hint={`${form.bio.length}/${BIO_LIMIT}`}>
                <Textarea
                  value={form.bio}
                  disabled={!canEdit}
                  onChange={(event) => setField("bio", event.target.value.slice(0, BIO_LIMIT))}
                  className={appTextareaClass}
                  placeholder="Briefly describe your experience, what you do best, and what employers should know about you."
                />
              </Field>

              <Field label="Top qualities (select up to 3)">
                <div className="grid grid-cols-2 gap-2">
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
                        className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-center text-[11px] font-black leading-4 transition ${
                          active ? "border-[#145B10] bg-[#EEF8EA] text-[#145B10]" : "border-[#E1EBDD] bg-white text-[#1B2431]"
                        } disabled:opacity-60`}
                      >
                        <Icon className="h-4 w-4" />
                        {def.title}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </SectionShell>

            <SectionShell icon={BriefcaseBusiness} title="Work details" description="These remain optional, but help with better matching.">
              <Field label="Education">
                <Select value={form.educationLevel} onValueChange={(value) => setField("educationLevel", value)} disabled={!canEdit}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-4 text-[#6B7668]">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Self-reported. No school document is required.
                </p>
              </Field>
              <Field label="Health / work capacity">
                <Select value={form.healthStatus} onValueChange={(value) => setField("healthStatus", value)} disabled={!canEdit}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEALTH_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Preferred work time">
                <Select value={form.preferredWorkTime} onValueChange={(value) => setField("preferredWorkTime", value)} disabled={!canEdit}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TIME_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </SectionShell>
          </>
        ) : null}

        {activeSection === "trust" ? (
          <SectionShell icon={ShieldCheck} title="Trust badges" description="Verification statuses are kept in sync with existing account data.">
            {[
              { icon: Phone, label: "Phone verified", action: "Verified", done: Boolean(form.phoneNumber) },
              { icon: FileBadge, label: "ID verified", action: "Upload ID", done: false },
              { icon: ClipboardCheck, label: "Background checked", action: "Verify", done: false },
              { icon: ShieldCheck, label: "Insurance", action: "Add", done: false },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-[#E1EBDD] bg-white p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF8EA] text-[#145B10]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-black text-[#1B2431]">{item.label}</span>
                  <span className={`rounded-md px-2.5 py-1 text-[11px] font-black ${item.done ? "bg-[#EEF8EA] text-[#145B10]" : "border border-[#BFD9BA] text-[#145B10]"}`}>
                    {item.action}
                  </span>
                </div>
              );
            })}
          </SectionShell>
        ) : null}

        {activeSection !== "overview" ? SaveBar : null}
      </form>
    </div>
  );
}
