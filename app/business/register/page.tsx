"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Briefcase, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/phone";
import { BusinessAuthShell } from "@/components/business/business-auth-shell";
import { PasswordField } from "@/components/business/password-field";
import { OtpCodeInput, OTP_LENGTH } from "@/components/ui/otp-code-input";
import { IconBadge } from "@/components/services/wizard/wizard-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import type { WizardGrouping, WizardJobType } from "@/components/services/wizard/WizardStep1ChooseCategory";

type OrgType = "SERVICE_COMPANY" | "STAFFING_AGENCY";
type AgencyModel = "PLACEMENT" | "DISPATCH";

function CategoryMultiPicker({
  tree,
  loading,
  search,
  onSearch,
  selectedIds,
  onToggle,
}: {
  tree: WizardGrouping[];
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const filtered = useMemo<WizardGrouping[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((g) => ({
        ...g,
        jobTypes: g.jobTypes.filter((jt) =>
          `${jt.name} ${jt.nameKn ?? ""}`.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.jobTypes.length > 0);
  }, [tree, search]);

  // Auto-expand when search narrows to a single group.
  useEffect(() => {
    if (filtered.length === 1) setOpenGroupId(filtered[0].id);
    else if (search.trim() === "") setOpenGroupId(null);
  }, [filtered.length, search]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search services…"
          className="h-11 w-full rounded-2xl border border-[#DCE8D9] bg-white pl-10 pr-4 text-[13px] outline-none placeholder:text-ink-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-muted">No services match your search.</p>
      ) : (
        filtered.map((g) => {
          const open = openGroupId === g.id;
          const selectedCount = g.jobTypes.filter((jt) => selectedIds.has(jt.id)).length;
          return (
            <div key={g.id} className="overflow-hidden rounded-2xl border border-[#DCE8D9] bg-white">
              {/* Group header — toggles open/close */}
              <button
                type="button"
                onClick={() => setOpenGroupId(open ? null : g.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-[#FBFEFA]"
              >
                <IconBadge icon={g.icon ?? null} />
                <span className="flex-1 text-[13px] font-bold text-ink">{g.name}</span>
                {selectedCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                    {selectedCount}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {/* Job types — shown when open */}
              {open && (
                <div className="flex flex-col gap-2 border-t border-[#DCE8D9] p-3">
                  {g.jobTypes.map((jt) => {
                    const selected = selectedIds.has(jt.id);
                    return (
                      <button
                        key={jt.id}
                        type="button"
                        onClick={() => onToggle(jt.id)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                          selected ? "border-brand bg-surface" : "border-[#DCE8D9] bg-white hover:bg-[#FBFEFA]"
                        }`}
                      >
                        <IconBadge icon={jt.icon ?? null} />
                        <span className="flex-1 text-[13px] font-semibold text-ink">{jt.name}</span>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          selected ? "border-brand bg-brand text-white" : "border-gray-300 bg-white"
                        }`}>
                          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// Matches the backend's OTP resend cooldown (AuthService.OTP_RESEND_COOLDOWN_SECONDS).
const RESEND_COOLDOWN_SECONDS = 60;

export default function BusinessRegisterPage() {
  const t = useTranslations("businessRegister");
  const locale = useLocale();
  // type-picker is its own full screen so the user is never overwhelmed by the
  // form before they have decided what kind of business they are registering.
  const [phase, setPhase] = useState<"type-picker" | "confirm" | "details" | "verify">("type-picker");
  const [type, setType] = useState<OrgType | null>(null);
  // Only asked when type is STAFFING_AGENCY — how the agency engages workers.
  const [agencyModel, setAgencyModel] = useState<AgencyModel | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [catSearch, setCatSearch] = useState("");
  const [tree, setTree] = useState<WizardGrouping[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);

  useEffect(() => {
    if (phase !== "details" || type !== "SERVICE_COMPANY" || tree.length > 0 || treeLoading) return;
    setTreeLoading(true);
    api.get("/taxonomy/tree")
      .then((res) => setTree(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setTreeLoading(false));
  }, [phase, type]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendIn, setResendIn] = useState(0);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    if (otpSecondsLeft <= 0) return;
    const id = setInterval(() => setOtpSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [otpSecondsLeft]);

  async function sendCode() {
    const res = await api.post("/auth/org/request-otp", {
      email: email.trim(),
      phone: normalizeRwandaPhone(phone),
      locale,
    });
    setResendIn(RESEND_COOLDOWN_SECONDS);
    return res;
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return toast.error(t("chooseBusinessType"));
    if (type === "STAFFING_AGENCY" && !agencyModel) return toast.error(t("chooseAgencyModel"));
    if (!name.trim()) return toast.error(t("enterBusinessName"));
    if (description.trim().length < 10) return toast.error(t("descriptionTooShort"));
    if (type === "SERVICE_COMPANY" && selectedCategoryIds.size === 0) return toast.error(t("chooseServiceCategory"));
    if (!email.trim()) return toast.error(t("enterEmailAddress"));
    // Required: this number receives the sign-up code and every later
    // password-reset code, and is how we reach the owner if the email is wrong.
    if (!isValidRwandaPhone(phone)) return toast.error(t("enterValidPhone"));
    if (password.length < 8) return toast.error(t("passwordTooShort"));
    if (password !== confirm) return toast.error(t("passwordsDoNotMatch"));

    setLoading(true);
    try {
      await sendCode();
      setCode(Array(OTP_LENGTH).fill(""));
      setOtpSecondsLeft(600);
      setPhase("verify");
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotSendCode")));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return;
    setLoading(true);
    try {
      await sendCode();
      setOtpSecondsLeft(600);
      toast.success(t("codeResent"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotSendCode")));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(otp: string) {
    setLoading(true);
    try {
      const res = await api.post("/auth/org/register", {
        name: name.trim(),
        type,
        email: email.trim(),
        password,
        phone: normalizeRwandaPhone(phone),
        otp,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(selectedCategoryIds.size ? { primaryCategoryIds: [...selectedCategoryIds] } : {}),
        ...(type === "STAFFING_AGENCY" && agencyModel ? { agencyModel } : {}),
      });
      const data = res.data?.data || res.data;
      if (!data?.token) throw new Error(t("noTokenReturned"));
      localStorage.setItem("token", data.token);
      // Mirror the token into the cookie so the Next.js middleware can see
      // the session on protected routes (/work, /more, /conversations, etc.).
      document.cookie = `token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(t("accountCreatedPendingVerification"));
      // Hard navigation so auth state re-hydrates from the stored token.
      // A service company is signed in as its own provider account and goes
      // through the business onboarding wizard first (profile, address,
      // first service listing) before it lands in the ordinary app; an
      // agency goes straight to the agency console.
      window.location.href = type === "SERVICE_COMPANY" ? "/business/onboarding" : "/agency";
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("couldNotCreateAccount")));
      setCode(Array(OTP_LENGTH).fill(""));
      setLoading(false);
    }
  }

  const typeCard = (orgType: OrgType, title: string, sub: string, Icon: typeof Building2) => (
    <button
      type="button"
      onClick={() => {
        setType(orgType);
        if (orgType !== "STAFFING_AGENCY") setAgencyModel(null);
        setPhase("confirm");
      }}
      className={`relative flex min-w-0 flex-1 items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        type === orgType ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-ink hover:border-brand"
      }`}
    >
      {type === orgType && <CheckCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-white" />}
      <div className={`rounded-lg p-2 ${type === orgType ? "bg-white/20" : "bg-surface"}`}>
        <Icon className={`h-5 w-5 ${type === orgType ? "text-white" : "text-brand"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-bold">{title}</p>
        <p className={`text-[11px] ${type === orgType ? "text-white/80" : "text-ink-muted"}`}>{sub}</p>
      </div>
    </button>
  );

  const agencyModelCard = (model: AgencyModel, title: string, sub: string) => (
    <button
      type="button"
      onClick={() => setAgencyModel(model)}
      className={`relative flex min-w-0 flex-1 flex-col items-start gap-1 rounded-xl border-2 p-3.5 text-left transition-all ${
        agencyModel === model ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-ink hover:border-brand"
      }`}
    >
      {agencyModel === model && <CheckCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-white" />}
      <p className="text-[13px] font-bold">{title}</p>
      <p className={`text-[11px] leading-snug ${agencyModel === model ? "text-white/80" : "text-ink-muted"}`}>{sub}</p>
    </button>
  );

  // Confirmation screen — shown after type is picked, before the form.
  // Asks if the user is actually an individual so they can self-correct.

  if (phase === "confirm") {
    return (
      <BusinessAuthShell
        icon={Building2}
        title={t("confirmIndividualTitle")}
        subtitle={t("confirmIndividualSubtitle")}
        maxWidthClass="max-w-[460px]"
        onBack={() => setPhase("type-picker")}
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/onboarding"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark"
          >
            {t("confirmIndividualYes")}
          </Link>
          <button
            type="button"
            onClick={() => setPhase("details")}
            className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-gray-200 text-[14px] font-bold text-ink hover:bg-gray-50"
          >
            {t("confirmIndividualNo")}
          </button>
        </div>
      </BusinessAuthShell>
    );
  }

  // ── Phase 1: full-screen type picker ──────────────────────────────────────
  if (phase === "type-picker") {
    return (
      <BusinessAuthShell
        icon={Building2}
        title={t("whatKindOfBusiness")}
        subtitle={t("pickOneToGetStarted")}
        maxWidthClass="max-w-[460px]"
        backHref="/onboarding"
        footer={
          <>
            {t("notABusiness")}{" "}
            <Link href="/onboarding" className="font-semibold text-brand hover:underline">{t("signUpAsIndividual")}</Link>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {typeCard("SERVICE_COMPANY", t("serviceCompany"), t("serviceCompanyDesc"), Building2)}
          {typeCard("STAFFING_AGENCY", t("staffingAgency"), t("staffingAgencyDesc"), Briefcase)}
        </div>
      </BusinessAuthShell>
    );
  }

  return (
    <BusinessAuthShell
      icon={Building2}
      title={phase === "details" ? t("registerYourBusiness") : t("verifyYourNumber")}
      subtitle={phase === "details" ? t("adminVerifiesAccount") : undefined}
      maxWidthClass="max-w-[460px]"
      onBack={phase === "details" ? () => setPhase("type-picker") : undefined}
      footer={
        <>
          <span className="block mb-1">
            {t("notABusiness")}{" "}
            <Link href="/onboarding" className="font-semibold text-brand hover:underline">{t("signUpAsIndividual")}</Link>
          </span>
          {t("alreadyHaveAccount")}{" "}
          <Link href="/business/login" className="font-semibold text-brand hover:underline">{t("signIn")}</Link>
        </>
      }
    >
      {phase === "details" ? (
        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          {/* Summary of chosen type with a change link */}
          <button
            type="button"
            onClick={() => setPhase("type-picker")}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-left hover:bg-gray-100"
          >
            <span className="text-[13px] font-semibold text-ink">
              {type === "SERVICE_COMPANY" ? t("serviceCompany") : t("staffingAgency")}
            </span>
            <span className="text-[12px] font-semibold text-brand">{t("change")}</span>
          </button>

          {type === "STAFFING_AGENCY" && (
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("agencyModelLabel")}</label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                {agencyModelCard("PLACEMENT", t("agencyModelPlacement"), t("agencyModelPlacementDesc"))}
                {agencyModelCard("DISPATCH", t("agencyModelDispatch"), t("agencyModelDispatchDesc"))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("businessName")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CleanPro Kigali Ltd"
              className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("businessDescription")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("businessDescriptionPlaceholder")}
              maxLength={2000}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-3 text-[14px] outline-none focus:border-brand"
            />
          </div>

          {type === "SERVICE_COMPANY" && (
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("serviceCategory")}</label>
              <p className="mb-2 text-[11.5px] text-ink-muted">{t("serviceCategoryHelp")}</p>
              <CategoryMultiPicker
                tree={tree}
                loading={treeLoading}
                search={catSearch}
                onSearch={setCatSearch}
                selectedIds={selectedCategoryIds}
                onToggle={(id) => setSelectedCategoryIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("emailYourLogin")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email"
                className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">{t("phone")}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0788…"
                type="tel" inputMode="tel" autoComplete="tel"
                className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
            </div>
          </div>

          <p className="-mt-1 text-[11.5px] leading-relaxed text-ink-muted">{t("phoneHelp")}</p>

          <PasswordField label={t("password")} value={password} onChange={setPassword} placeholder={t("atLeast8Characters")} />
          <PasswordField label={t("confirmPassword")} value={confirm} onChange={setConfirm} placeholder={t("reEnterPassword")} />

          <button type="submit" disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("continue")}
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <p className="text-center text-[13px] text-ink-muted">
            {t.rich("codeSentTo", {
              phone: normalizeRwandaPhone(phone),
              b: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
            })}
          </p>

          <OtpCodeInput
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            autoFocus
            ariaLabel={t("verificationCode")}
          />

          {otpSecondsLeft > 0 && (
            <p className={`text-center text-xs ${otpSecondsLeft <= 60 ? "text-red-500 font-semibold" : "text-ink-muted"}`}>
              {otpSecondsLeft <= 60
                ? t("codeExpiresIn", { seconds: otpSecondsLeft })
                : t("codeValidFor", { minutes: Math.ceil(otpSecondsLeft / 60) })}
            </p>
          )}
          {otpSecondsLeft === 0 && (
            <p className="text-center text-xs text-red-500 font-semibold">{t("codeExpired")}</p>
          )}

          <p className="text-center text-[11px] text-ink-muted">{t("useLatestCode")}</p>

          <div className="text-center">
            {resendIn > 0 ? (
              <p className="text-[13px] text-ink-muted">{t("resendCodeIn", { seconds: resendIn })}</p>
            ) : (
              <button type="button" onClick={handleResend} disabled={loading}
                className="text-[13px] font-semibold text-brand underline underline-offset-2 disabled:opacity-60">
                {t("resendCode")}
              </button>
            )}
          </div>

          <button type="button" onClick={() => handleVerify(code.join(""))}
            disabled={loading || code.join("").length < OTP_LENGTH}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("createAccount")}
          </button>

          <button type="button" onClick={() => setPhase("details")} disabled={loading}
            className="h-11 w-full rounded-xl border-2 border-gray-200 text-[13px] font-bold text-ink hover:bg-gray-50 disabled:opacity-60">
            {t("backToDetails")}
          </button>
        </div>
      )}
    </BusinessAuthShell>
  );
}
