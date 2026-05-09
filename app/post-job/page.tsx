"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import BackButtonHeader from "@/components/header/back-button-header";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  "House Cleaning",
  "Cooking",
  "Nanny / Childcare",
  "Electrician",
  "Plumbing",
  "Painting",
  "Carpentry",
  "Gardening",
  "Laundry",
  "Driver",
  "Security Guard",
  "Pet Care",
  "AC Repair",
  "Tutoring",
  "Errands",
  "Other",
];

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
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    budgetMin: "",
    budgetMax: "",
    date: "",
    urgency: "flexible",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.description || !form.location) {
      toast.error("Please fill in all required fields.");
      return;
    }
    toast.success("Job posting coming soon!");
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#F1FCEF]">
      <div className="sticky top-0 z-20 bg-[#F1FCEF] px-4 pt-4 pb-3 shadow-sm">
        <BackButtonHeader text="Post a Custom Job" backHref="/" />
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-28 pt-4 space-y-4">

        {/* What do you need? */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm border border-gray-100">
          <h2 className="text-[13px] font-bold text-[#1B2431]">What do you need?</h2>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#1B2431]">
              Job title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Need a cleaner for Saturday morning"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-[#1B2431] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#145B10]/30"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#1B2431]">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-[#1B2431] bg-white focus:outline-none focus:ring-2 focus:ring-[#145B10]/30"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#1B2431]">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe what you need in detail — size of home, number of rooms, any special requirements..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-[#1B2431] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#145B10]/30 resize-none"
            />
          </div>
        </div>

        {/* Location & Timing */}
        <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm border border-gray-100">
          <h2 className="text-[13px] font-bold text-[#1B2431]">Location & Timing</h2>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#1B2431]">
              District <span className="text-red-500">*</span>
            </label>
            <select
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-[#1B2431] bg-white focus:outline-none focus:ring-2 focus:ring-[#145B10]/30"
            >
              <option value="">Select your district</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Preferred date */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#1B2431]">Preferred date</label>
            <input
              type="date"
              value={form.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("date", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-[#1B2431] focus:outline-none focus:ring-2 focus:ring-[#145B10]/30"
            />
          </div>

          {/* Urgency */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#1B2431]">Urgency</label>
            <div className="flex gap-2">
              {["urgent", "this week", "flexible"].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => set("urgency", opt)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-semibold capitalize border transition-colors ${
                    form.urgency === opt
                      ? "bg-[#145B10] text-white border-[#145B10]"
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
          <h2 className="text-[13px] font-bold text-[#1B2431]">Budget <span className="text-[11px] font-normal text-gray-400">(optional)</span></h2>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-[12px] font-semibold text-[#1B2431]">Min (RWF)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={form.budgetMin}
                onChange={(e) => set("budgetMin", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-[#1B2431] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#145B10]/30"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[12px] font-semibold text-[#1B2431]">Max (RWF)</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={form.budgetMax}
                onChange={(e) => set("budgetMax", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-[#1B2431] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#145B10]/30"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#145B10] text-white font-bold py-3.5 rounded-2xl text-[14px] flex items-center justify-center gap-2 hover:bg-[#0f4a0c] transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Posting…" : "Post Job"}
        </button>
      </form>
    </div>
  );
};

export default PostJobPage;
