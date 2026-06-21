"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Briefcase, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/error-handler";
import { colors } from "@/constant/colors";

type OrgType = "SERVICE_COMPANY" | "STAFFING_AGENCY";

export default function BusinessRegisterPage() {
  const [type, setType] = useState<OrgType | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return toast.error("Choose your business type");
    if (!name.trim()) return toast.error("Enter your business name");
    if (!email.trim()) return toast.error("Enter an email address");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res = await api.post("/auth/org/register", {
        name: name.trim(),
        type,
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      const data = res.data?.data || res.data;
      if (!data?.token) throw new Error("No token returned");
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Account created — pending verification.");
      // Hard navigation so auth state re-hydrates from the stored token.
      // Service companies manage service cards; agencies use the agency console.
      window.location.href =
        type === "SERVICE_COMPANY" ? "/business/services" : "/agency";
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create your account"));
      setLoading(false);
    }
  }

  const typeCard = (t: OrgType, title: string, sub: string, Icon: typeof Building2) => (
    <button
      type="button"
      onClick={() => setType(t)}
      className={`relative flex flex-1 items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        type === t ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-ink hover:border-brand"
      }`}
    >
      {type === t && <CheckCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-white" />}
      <div className={`rounded-lg p-2 ${type === t ? "bg-white/20" : "bg-surface"}`}>
        <Icon className={`h-5 w-5 ${type === t ? "text-white" : "text-brand"}`} />
      </div>
      <div>
        <p className="text-[14px] font-bold">{title}</p>
        <p className={`text-[11px] ${type === t ? "text-white/80" : "text-ink-muted"}`}>{sub}</p>
      </div>
    </button>
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F7F3] px-4 py-10">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-[22px] font-black tracking-tight text-brand">Akazek</span>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.backgroundTertiary }}>
              <Building2 className="h-7 w-7" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-[22px] font-black text-ink">Register your business</h1>
            <p className="mt-1 text-[13px] text-ink-muted">An admin verifies your account before it goes live.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              {typeCard("SERVICE_COMPANY", "Service Company", "Offer services directly", Building2)}
              {typeCard("STAFFING_AGENCY", "Staffing Agency", "Place workers with families", Briefcase)}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">Business name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CleanPro Kigali Ltd"
                className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Email (your login)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">Phone (optional)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0788…"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters" autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 pr-11 text-[14px] outline-none focus:border-brand" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink">
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">Confirm password</label>
              <input type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password" autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-[14px] outline-none focus:border-brand" />
            </div>

            <button type="submit" disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-ink-muted">
          Already have an account?{" "}
          <Link href="/business/login" className="font-semibold text-brand hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
