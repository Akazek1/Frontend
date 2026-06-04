"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButtonHeader from "@/components/header/back-button-header";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import jobsService from "@/services/jobs-service";
import { getApiErrorMessage } from "@/lib/error-handler";

interface Category {
  id: string;
  name: string;
}

const DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rutsiro", "Rusizi",
];

const PostJobPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    district: "",
    budgetMin: "",
    budgetMax: "",
    startDate: "",
    scheduleType: "one-time",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/services/categories");
        setCategories(response.data.data || response.data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.categoryId || !form.description || !form.district) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await jobsService.createJob({
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        district: form.district || undefined,
        city: "Kigali",
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        startDate: form.startDate || undefined,
        scheduleType: form.scheduleType,
      });
      toast.success("Job posted successfully!");
      router.push("/work/job-posts");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to post job."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg">
      <div className="sticky top-0 z-20 app-bg px-4 pt-4 pb-3 shadow-sm">
        <BackButtonHeader text="Post a Custom Job" backHref="/" />
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-28 pt-4 space-y-4">

        {/* What do you need? */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm border border-gray-100">
          <h2 className="text-[13px] font-bold text-ink">What do you need?</h2>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink">
              Job title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Need a cleaner for Saturday morning"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe what you need in detail — size of home, number of rooms, any special requirements..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>
        </div>

        {/* Location & Timing */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm border border-gray-100">
          <h2 className="text-[13px] font-bold text-ink">Location & Timing</h2>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink">
              District <span className="text-red-500">*</span>
            </label>
            <select
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Select your district</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Preferred date */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink">Preferred start date</label>
            <input
              type="date"
              value={form.startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("startDate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Schedule Type */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink">Schedule</label>
            <div className="flex flex-wrap gap-2">
              {["one-time", "daily", "weekly", "monthly", "live-in"].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => set("scheduleType", opt)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-semibold capitalize border transition-colors ${
                    form.scheduleType === opt
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-[#616161] border-gray-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm border border-gray-100">
          <h2 className="text-[13px] font-bold text-ink">Budget <span className="text-[11px] font-normal text-gray-400">(optional)</span></h2>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-[12px] font-semibold text-ink">Min (RWF)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={form.budgetMin}
                onChange={(e) => set("budgetMin", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[12px] font-semibold text-ink">Max (RWF)</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={form.budgetMax}
                onChange={(e) => set("budgetMax", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl text-[14px] flex items-center justify-center gap-2 hover:bg-[#0f4a0c] transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Posting…" : "Post Job"}
        </button>
      </form>
    </div>
  );
};

export default PostJobPage;
