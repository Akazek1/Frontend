"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Crosshair, Hash, Loader2, MapPin, X } from "lucide-react";
import {
  RWANDA_PROVINCES,
  RwandaCell,
  RwandaSector,
  ViewerLocation,
  cellsBySectorPcode,
  districtsByProvince,
  sectorsByDistrict,
} from "@/constants/rwanda-sectors";
import type { RwandaVillage } from "@/constants/rwanda-villages";

interface Props {
  value: ViewerLocation | null;
  onChange: (loc: ViewerLocation) => void;
  placeholder?: string;
  /** Controlled open state. When provided, no trigger button is rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = "province" | "district" | "sector" | "cell" | "village";
type InputMode = "pick" | "gps" | "coords";

// Computed once at module load — sectors and cells are eagerly bundled.
const byProvince = districtsByProvince();
const byDistrict = sectorsByDistrict();
const byPcode    = cellsBySectorPcode();

export function SectorPicker({
  value,
  onChange,
  placeholder = "Select neighborhood",
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep]               = useState<Step>("province");
  const [selProvince, setSelProvince] = useState<string | null>(null);
  const [selDistrict, setSelDistrict] = useState<string | null>(null);
  const [selSector,   setSelSector]   = useState<RwandaSector | null>(null);
  const [selCell,     setSelCell]     = useState<RwandaCell | null>(null);

  // Villages lazy-loaded the first time the user reaches the cell step.
  const [villagesMap, setVillagesMap]         = useState<Map<string, RwandaVillage[]> | null>(null);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // GPS / manual-coordinates mode
  const [inputMode, setInputMode] = useState<InputMode>("pick");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "error">("idle");
  const [gpsError, setGpsError]   = useState<string>("");
  const [coordLat, setCoordLat]   = useState("");
  const [coordLng, setCoordLng]   = useState("");
  const [coordStatus, setCoordStatus] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [coordPreview, setCoordPreview] = useState<ViewerLocation | null>(null);
  const latRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (v: boolean) => {
    if (!v) {
      setStep("province");
      setSelProvince(null); setSelDistrict(null); setSelSector(null); setSelCell(null);
      setInputMode("pick");
      setGpsStatus("idle"); setGpsError("");
      setCoordLat(""); setCoordLng(""); setCoordStatus("idle"); setCoordPreview(null);
    }
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  // Pre-load village data as soon as we reach the cell step so the "▸"
  // arrows on cells are visible before the user taps one.
  useEffect(() => {
    if (step === "cell" && villagesMap === null && !loadingVillages) {
      setLoadingVillages(true);
      import("@/constants/rwanda-villages").then((mod) => {
        setVillagesMap(mod.villagesByCellPcode());
        setLoadingVillages(false);
      });
    }
  }, [step, villagesMap, loadingVillages]);

  const commit = (loc: ViewerLocation) => { onChange(loc); setOpen(false); };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const ensureVillages = async () => {
    if (villagesMap) return villagesMap;
    setLoadingVillages(true);
    const mod = await import("@/constants/rwanda-villages");
    const m = mod.villagesByCellPcode();
    setVillagesMap(m);
    setLoadingVillages(false);
    return m;
  };

  const villageToLoc = (v: RwandaVillage): ViewerLocation => ({
    province: v.province, district: v.district, sector: v.sector,
    cell: v.cell, village: v.village, lat: v.lat, lng: v.lng,
  });

  // ── GPS ───────────────────────────────────────────────────────────────────

  const useGps = () => {
    setInputMode("gps");
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mod = await import("@/constants/rwanda-villages");
        const nearest = mod.reverseGeocode(latitude, longitude);
        if (nearest) {
          commit(villageToLoc(nearest));
        } else {
          setGpsStatus("error");
          setGpsError("Could not match your location to a known area.");
        }
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(
          err.code === 1
            ? "Location permission denied. Please allow access in your browser settings."
            : "Could not get your location. Please try again.",
        );
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  // ── Manual coordinates ────────────────────────────────────────────────────

  const switchToCoords = () => {
    setInputMode("coords");
    setTimeout(() => latRef.current?.focus(), 80);
  };

  const findByCoords = async () => {
    const lat = parseFloat(coordLat);
    const lng = parseFloat(coordLng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -4 || lat > 0 || lng < 28 || lng > 32) {
      setCoordStatus("error");
      return;
    }
    setCoordStatus("loading");
    const mod = await import("@/constants/rwanda-villages");
    const nearest = mod.reverseGeocode(lat, lng);
    if (nearest) {
      setCoordPreview(villageToLoc(nearest));
      setCoordStatus("found");
    } else {
      setCoordStatus("error");
    }
  };

  // ── Cascade handlers ──────────────────────────────────────────────────────

  const pickProvince = (p: string) => { setSelProvince(p); setStep("district"); };
  const pickDistrict = (d: string) => { setSelDistrict(d); setStep("sector"); };

  const pickSector = (s: RwandaSector) => {
    setSelSector(s);
    const cells = byPcode.get(s.pcode) ?? [];
    if (cells.length === 0) {
      commit({ province: s.province, district: s.district, sector: s.sector, lat: s.lat, lng: s.lng });
    } else {
      setStep("cell");
    }
  };

  const pickCell = (c: RwandaCell) => {
    setSelCell(c);
    const villages = villagesMap?.get(c.pcode) ?? [];
    if (villages.length > 0) {
      setStep("village");
    } else {
      if (villagesMap === null) {
        setLoadingVillages(true);
        import("@/constants/rwanda-villages").then((mod) => {
          const m = mod.villagesByCellPcode();
          setVillagesMap(m);
          setLoadingVillages(false);
          if ((m.get(c.pcode) ?? []).length > 0) setStep("village");
          else commit({ province: c.province, district: c.district, sector: c.sector, cell: c.cell, lat: c.lat, lng: c.lng });
        });
      } else {
        commit({ province: c.province, district: c.district, sector: c.sector, cell: c.cell, lat: c.lat, lng: c.lng });
      }
    }
  };

  const pickVillage = (v: RwandaVillage) => {
    commit({ province: v.province, district: v.district, sector: v.sector, cell: v.cell, village: v.village, lat: v.lat, lng: v.lng });
  };

  const useSector = () => {
    if (!selSector) return;
    commit({ province: selSector.province, district: selSector.district, sector: selSector.sector, lat: selSector.lat, lng: selSector.lng });
  };

  const useCell = () => {
    if (!selCell) return;
    commit({ province: selCell.province, district: selCell.district, sector: selCell.sector, cell: selCell.cell, lat: selCell.lat, lng: selCell.lng });
  };

  const back = () => {
    if      (step === "village")  { setStep("cell");     setSelCell(null); }
    else if (step === "cell")     { setStep("sector");   setSelSector(null); }
    else if (step === "sector")   { setStep("district"); setSelDistrict(null); }
    else if (step === "district") { setStep("province"); setSelProvince(null); }
  };

  const stepTitle: Record<Step, string> = {
    province: "Select province",
    district: `${selProvince ?? ""} — district`,
    sector:   `${selDistrict ?? ""} — sector`,
    cell:     `${selSector?.sector ?? ""} — cell`,
    village:  `${selCell?.cell ?? ""} — village`,
  };

  const stepHint: Record<Step, string> = {
    province: "Which province are you based in?",
    district: "Which district?",
    sector:   "Which sector?",
    cell:     "Pick your cell for better accuracy, or use the sector.",
    village:  "Pick your village for the best accuracy, or use the cell.",
  };

  const displayLabel = value
    ? value.village
      ? `${value.village}, ${value.cell}`
      : value.cell
        ? `${value.cell}, ${value.sector}`
        : value.sector
    : null;

  const displaySub = value ? `${value.district}, ${value.province}` : null;

  const cells    = selSector ? (byPcode.get(selSector.pcode) ?? []) : [];
  const villages = selCell   ? (villagesMap?.get(selCell.pcode) ?? []) : [];

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
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {inputMode !== "pick" ? (
                  <button type="button" onClick={() => { setInputMode("pick"); setGpsStatus("idle"); setCoordStatus("idle"); setCoordPreview(null); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F6F1] text-ink hover:bg-[#E1EBE1]">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : step !== "province" ? (
                  <button type="button" onClick={back}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F6F1] text-ink hover:bg-[#E1EBE1]">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <div>
                  <p className="text-[16px] font-bold text-ink">
                    {inputMode === "gps" ? "Using GPS" : inputMode === "coords" ? "Enter coordinates" : stepTitle[step]}
                  </p>
                  <p className="text-[12px] text-[#687268]">
                    {inputMode === "pick" ? stepHint[step] : ""}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F6F1] text-[#687268] hover:bg-[#E1EBE1]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* GPS / Coords quick-access buttons — only shown on first province step */}
            {inputMode === "pick" && step === "province" && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={useGps}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#E1EBDD] bg-[#F8FBF8] px-3 py-2.5 text-[12px] font-semibold text-ink transition hover:border-brand hover:bg-[#EEF8EA] hover:text-brand">
                  <Crosshair className="h-4 w-4 flex-shrink-0" />
                  Use GPS location
                </button>
                <button type="button" onClick={switchToCoords}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#E1EBDD] bg-[#F8FBF8] px-3 py-2.5 text-[12px] font-semibold text-ink transition hover:border-brand hover:bg-[#EEF8EA] hover:text-brand">
                  <Hash className="h-4 w-4 flex-shrink-0" />
                  Enter coordinates
                </button>
              </div>
            )}

            {/* ── GPS mode ─────────────────────────────────────────────────── */}
            {inputMode === "gps" && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                {gpsStatus === "loading" && (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-brand" />
                    <p className="text-[14px] font-semibold text-ink">Getting your location…</p>
                    <p className="text-[12px] text-[#687268]">Please allow location access if prompted.</p>
                  </>
                )}
                {gpsStatus === "error" && (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                      <Crosshair className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-[14px] font-semibold text-ink">Location unavailable</p>
                    <p className="max-w-[260px] text-[12px] leading-5 text-[#687268]">{gpsError}</p>
                    <button type="button" onClick={() => { setGpsStatus("idle"); setInputMode("pick"); }}
                      className="mt-2 rounded-xl bg-brand px-5 py-2 text-[13px] font-bold text-white">
                      Pick manually instead
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Coordinates mode ─────────────────────────────────────────── */}
            {inputMode === "coords" && (
              <div className="space-y-4">
                <p className="text-[12px] text-[#687268]">
                  Enter WGS-84 decimal coordinates for any point in Rwanda.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-[11px] font-bold uppercase text-[#687268]">Latitude</span>
                    <input
                      ref={latRef}
                      type="number"
                      step="any"
                      placeholder="-1.9441"
                      value={coordLat}
                      onChange={(e) => { setCoordLat(e.target.value); setCoordStatus("idle"); setCoordPreview(null); }}
                      className="h-11 w-full rounded-xl border border-[#E1EBDD] px-3 text-[14px] font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-bold uppercase text-[#687268]">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="30.0588"
                      value={coordLng}
                      onChange={(e) => { setCoordLng(e.target.value); setCoordStatus("idle"); setCoordPreview(null); }}
                      className="h-11 w-full rounded-xl border border-[#E1EBDD] px-3 text-[14px] font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </label>
                </div>

                {coordStatus === "error" && (
                  <p className="text-[12px] font-semibold text-red-500">
                    Enter valid decimal coordinates within Rwanda (lat −4 to 0, lng 28 to 32).
                  </p>
                )}

                {coordStatus === "found" && coordPreview && (
                  <div className="rounded-xl border border-brand/30 bg-[#EEF8EA] p-4 space-y-1">
                    <p className="text-[11px] font-bold uppercase text-brand">Nearest location found</p>
                    <p className="text-[14px] font-bold text-ink">{coordPreview.village}, {coordPreview.cell}</p>
                    <p className="text-[12px] text-[#687268]">{coordPreview.sector}, {coordPreview.district}</p>
                    <p className="text-[12px] text-[#687268]">{coordPreview.province}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={findByCoords}
                    disabled={coordStatus === "loading" || !coordLat || !coordLng}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[13px] font-bold text-white transition disabled:opacity-50"
                  >
                    {coordStatus === "loading"
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Finding…</>
                      : "Find location"}
                  </button>
                  {coordStatus === "found" && coordPreview && (
                    <button
                      type="button"
                      onClick={() => commit(coordPreview)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-brand bg-white py-3 text-[13px] font-bold text-brand transition hover:bg-[#EEF8EA]"
                    >
                      <Check className="h-4 w-4" /> Use this
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Cascade picker ────────────────────────────────────────────── */}

            {/* Step 1: Province */}
            {inputMode === "pick" && step === "province" && (
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
            {inputMode === "pick" && step === "district" && selProvince && (
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
            {inputMode === "pick" && step === "sector" && selDistrict && (
              <div className="grid grid-cols-2 gap-2">
                {(byDistrict.get(selDistrict) ?? []).map((s) => {
                  const hasCells = (byPcode.get(s.pcode) ?? []).length > 0;
                  const active   = value?.sector === s.sector && value?.district === s.district && !value?.cell;
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
            {inputMode === "pick" && step === "cell" && selSector && (
              <>
                <button type="button" onClick={useSector}
                  className="mb-3 flex w-full items-center justify-between rounded-xl border border-dashed border-brand/40 bg-[#F8FBF8] px-3 py-2.5 text-left text-[13px] transition hover:border-brand hover:bg-[#EEF8EA]">
                  <span className="font-semibold text-brand">Use {selSector.sector} sector</span>
                  <span className="text-[11px] text-ink-muted">less precise</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {cells.map((c) => {
                    const hasVillages = (villagesMap?.get(c.pcode) ?? []).length > 0;
                    const active      = value?.cell === c.cell && value?.sector === c.sector && !value?.village;
                    return (
                      <button key={c.cell} type="button" onClick={() => pickCell(c)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                          active ? "border-brand bg-[#EEF8EA] text-brand" : "border-[#E1EBDD] bg-white text-ink hover:border-brand/50 hover:bg-[#F8FBF8]"
                        }`}>
                        <span>{c.cell}</span>
                        {active
                          ? <Check className="h-4 w-4 flex-shrink-0" />
                          : hasVillages && <span className="text-[10px] text-ink-muted">▸</span>}
                      </button>
                    );
                  })}
                </div>
                {loadingVillages && (
                  <p className="mt-3 text-center text-[11px] text-ink-muted">Loading villages…</p>
                )}
              </>
            )}

            {/* Step 5: Village */}
            {inputMode === "pick" && step === "village" && selCell && (
              <>
                <button type="button" onClick={useCell}
                  className="mb-3 flex w-full items-center justify-between rounded-xl border border-dashed border-brand/40 bg-[#F8FBF8] px-3 py-2.5 text-left text-[13px] transition hover:border-brand hover:bg-[#EEF8EA]">
                  <span className="font-semibold text-brand">Use {selCell.cell} cell</span>
                  <span className="text-[11px] text-ink-muted">less precise</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {villages.map((v) => {
                    const active = value?.village === v.village && value?.cell === v.cell;
                    return (
                      <button key={v.village} type="button" onClick={() => pickVillage(v)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                          active ? "border-brand bg-[#EEF8EA] text-brand" : "border-[#E1EBDD] bg-white text-ink hover:border-brand/50 hover:bg-[#F8FBF8]"
                        }`}>
                        <span>{v.village}</span>
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
