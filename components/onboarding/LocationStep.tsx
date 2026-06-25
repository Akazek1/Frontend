"use client";

import { useState } from "react";
import { MapPin, ArrowRight, SkipForward } from "lucide-react";
import { SectorPicker } from "@/components/ui/sector-picker";
import {
  type ViewerLocation,
  saveViewerLocation,
} from "@/constants/rwanda-sectors";
import api from "@/lib/axios";

interface Props {
  onContinue: () => void;
}

export function LocationStep({ onContinue }: Props) {
  const [loc, setLoc] = useState<ViewerLocation | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!loc) { onContinue(); return; }
    setSaving(true);
    try {
      await api.post("/users/addresses", {
        city: loc.district,
        district: loc.district,
        sector: loc.sector,
        ...(loc.cell ? { cell: loc.cell } : {}),
        isDefault: true,
        latitude: loc.lat,
        longitude: loc.lng,
      });
      // Also persist to localStorage so search picks it up immediately.
      saveViewerLocation(loc);
    } catch {
      // Non-fatal — can be set later in profile.
    } finally {
      setSaving(false);
      onContinue();
    }
  };

  const locationSummary = loc
    ? loc.village
      ? `${loc.village}, ${loc.cell}, ${loc.sector}`
      : loc.cell
        ? `${loc.cell}, ${loc.sector}`
        : loc.sector
    : null;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-4">
        {/* Icon + header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF8EA]">
            <MapPin className="h-8 w-8 text-brand" />
          </div>
          <h2 className="text-[22px] font-bold leading-tight text-ink">Where are you based?</h2>
          <p className="mt-2 max-w-[280px] text-[13px] leading-5 text-[#687268]">
            This helps clients near you find your services. You can always change it later.
          </p>
        </div>

        {/* Picker */}
        <SectorPicker
          value={loc}
          onChange={setLoc}
          placeholder="Select your area"
        />

        {/* Confirmation preview */}
        {loc && locationSummary && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-brand/20 bg-[#EEF8EA] px-3 py-3">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink truncate">{locationSummary}</p>
              <p className="text-[11px] text-[#687268] truncate">{loc.district}, {loc.province}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-[#E8EDE6] bg-white px-4 py-4 space-y-2.5">
        <button
          type="button"
          onClick={handleContinue}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-[100px] bg-brand py-4 text-[15px] font-bold text-white transition disabled:opacity-60 hover:bg-[#0f4a0c]"
        >
          {saving ? "Saving…" : loc ? "Continue" : "Skip for now"}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </button>
        {loc && (
          <button
            type="button"
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-[#687268] hover:text-ink"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip — add location later
          </button>
        )}
      </div>
    </div>
  );
}
