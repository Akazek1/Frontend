"use client";

import { useState } from "react";
import { Check, ChevronLeft, MapPin, X } from "lucide-react";
import {
  RWANDA_PROVINCES,
  RwandaCell,
  RwandaSector,
  ViewerLocation,
  cellsBySectorPcode,
  districtsByProvince,
  sectorsByDistrict,
} from "@/constants/rwanda-sectors";

interface Props {
  value: ViewerLocation | null;
  onChange: (loc: ViewerLocation) => void;
  placeholder?: string;
  /** Controlled open state. When provided, no trigger button is rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = "province" | "district" | "sector" | "cell";

const byProvince  = districtsByProvince();
const byDistrict  = sectorsByDistrict();
const byPcode     = cellsBySectorPcode();

export function SectorPicker({
  value,
  onChange,
  placeholder = "Select neighborhood",
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<Step>("province");
  const [selProvince, setSelProvince] = useState<string | null>(null);
  const [selDistrict, setSelDistrict] = useState<string | null>(null);
  const [selSector,   setSelSector]   = useState<RwandaSector | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (v: boolean) => {
    if (!v) { setStep("province"); setSelProvince(null); setSelDistrict(null); setSelSector(null); }
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const pickProvince = (p: string) => { setSelProvince(p); setStep("district"); };
  const pickDistrict = (d: string) => { setSelDistrict(d); setStep("sector"); };

  const pickSector = (s: RwandaSector) => {
    setSelSector(s);
    const cells = byPcode.get(s.pcode) ?? [];
    if (cells.length === 0) {
      // No cell data — complete at sector level
      commit({ province: s.province, district: s.district, sector: s.sector, lat: s.lat, lng: s.lng });
    } else {
      setStep("cell");
    }
  };

  const pickCell = (c: RwandaCell) => {
    commit({ province: c.province, district: c.district, sector: c.sector, cell: c.cell, lat: c.lat, lng: c.lng });
  };

  const useSector = () => {
    if (!selSector) return;
    commit({ province: selSector.province, district: selSector.district, sector: selSector.sector, lat: selSector.lat, lng: selSector.lng });
  };

  const commit = (loc: ViewerLocation) => { onChange(loc); setOpen(false); };

  const back = () => {
    if (step === "cell")     { setStep("sector"); setSelSector(null); }
    else if (step === "sector")  { setStep("district"); setSelDistrict(null); }
    else if (step === "district") { setStep("province"); setSelProvince(null); }
  };

  const stepTitle: Record<Step, string> = {
    province: "Select province",
    district: `${selProvince ?? ""} — district`,
    sector:   `${selDistrict ?? ""} — sector`,
    cell:     `${selSector?.sector ?? ""} — cell`,
  };

  const stepHint: Record<Step, string> = {
    province: "Which province are you based in?",
    district: "Which district?",
    sector:   "Which sector?",
    cell:     "Pick your cell for better accuracy, or use the sector.",
  };

  const displayLabel = value
    ? value.cell
      ? `${value.cell}, ${value.sector}`
      : value.sector
    : null;

  const displaySub = value ? `${value.district}, ${value.province}` : null;

  const cells = selSector ? (byPcode.get(selSector.pcode) ?? []) : [];

  return (
    <>
      {/* Trigger button — hidden in controlled mode */}
      {!isControlled && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-[#E1EBDD] bg-white px-3 py-2.5 text-left text-[13px] transition hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 flex-shrink-0 text-brand" />
            {displayLabel ? (
              <span className="flex flex-col min-w-0">
                <span className="font-semibold text-ink truncate">{displayLabel}</span>
                <span className="text-[10px] font-normal text-ink-muted truncate">{displaySub}</span>
              </span>
            ) : (
              <span className="text-[#9ca3af]">{placeholder}</span>
            )}
          </span>
          <span className="ml-2 flex-shrink-0 text-[11px] font-semibold text-brand">
            {displayLabel ? "Change" : "Select"}
          </span>
        </button>
      )}

      {/* Bottom-sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-[120] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative z-10 max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-8 pt-4 shadow-xl">

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step !== "province" && (
                  <button type="button" onClick={back}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F6F1] text-ink hover:bg-[#E1EBE1]">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <p className="text-[16px] font-bold text-ink">{stepTitle[step]}</p>
                  <p className="text-[12px] text-[#687268]">{stepHint[step]}</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F6F1] text-[#687268] hover:bg-[#E1EBE1]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step 1: Province */}
            {step === "province" && (
              <div className="flex flex-col gap-2">
                {RWANDA_PROVINCES.map((p) => (
                  <button key={p} type="button" onClick={() => pickProvince(p)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-[14px] font-semibold transition ${
                      value?.province === p
                        ? "border-brand bg-[#EEF8EA] text-brand"
                        : "border-[#E1EBDD] bg-white text-ink hover:border-brand/50 hover:bg-[#F8FBF8]"
                    }`}>
                    <span>{p}</span>
                    <span className="text-[11px] font-normal text-ink-muted">
                      {byProvince.get(p)?.length ?? 0} districts →
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: District */}
            {step === "district" && selProvince && (
              <div className="grid grid-cols-2 gap-2">
                {(byProvince.get(selProvince) ?? []).map((d) => {
                  const active = value?.district === d && value?.province === selProvince;
                  return (
                    <button key={d} type="button" onClick={() => pickDistrict(d)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                        active ? "border-brand bg-[#EEF8EA] text-brand" : "border-[#E1EBDD] bg-white text-ink hover:border-brand/50 hover:bg-[#F8FBF8]"
                      }`}>
                      <span>{d}</span>
                      {active && <Check className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Sector */}
            {step === "sector" && selDistrict && (
              <div className="grid grid-cols-2 gap-2">
                {(byDistrict.get(selDistrict) ?? []).map((s) => {
                  const hasCells = (byPcode.get(s.pcode) ?? []).length > 0;
                  const active = value?.sector === s.sector && value?.district === s.district && !value?.cell;
                  return (
                    <button key={s.sector} type="button" onClick={() => pickSector(s)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                        active ? "border-brand bg-[#EEF8EA] text-brand" : "border-[#E1EBDD] bg-white text-ink hover:border-brand/50 hover:bg-[#F8FBF8]"
                      }`}>
                      <span>{s.sector}</span>
                      {active
                        ? <Check className="h-4 w-4 flex-shrink-0" />
                        : hasCells && <span className="text-[10px] text-ink-muted">▸</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 4: Cell */}
            {step === "cell" && selSector && (
              <>
                {/* Skip-to-sector button */}
                <button type="button" onClick={useSector}
                  className="mb-3 flex w-full items-center justify-between rounded-xl border border-dashed border-brand/40 bg-[#F8FBF8] px-3 py-2.5 text-left text-[13px] transition hover:border-brand hover:bg-[#EEF8EA]">
                  <span className="font-semibold text-brand">Use {selSector.sector} sector</span>
                  <span className="text-[11px] text-ink-muted">less precise</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {cells.map((c) => {
                    const active = value?.cell === c.cell && value?.sector === c.sector;
                    return (
                      <button key={c.cell} type="button" onClick={() => pickCell(c)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                          active ? "border-brand bg-[#EEF8EA] text-brand" : "border-[#E1EBDD] bg-white text-ink hover:border-brand/50 hover:bg-[#F8FBF8]"
                        }`}>
                        {c.cell}
                        {active && <Check className="h-4 w-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
