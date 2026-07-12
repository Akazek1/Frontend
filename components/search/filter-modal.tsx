"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AppButton,
  SheetBody,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPanel,
  appFieldLabelClass,
  appInputClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialFilters: FilterValues;
}

export interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  serviceType?: string;
  availability?: string;
  location?: string;
  distanceKm?: number;
}

const LOCATIONS = ["Kicukiro", "Nyarugenge", "Gasabo", "Kigali", "Remera"];

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, initialFilters }) => {
  const t = useTranslations("filterModal");
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetValues = {};
    setFilters(resetValues);
    onApply(resetValues);
    onClose();
  };

  return (
    <>
      <SheetOverlay className="bg-black/50" onClick={onClose} aria-hidden="true" />
      <SheetPanel className="overflow-hidden sm:rounded-3xl" side="bottom" onClose={onClose}>
        <SheetHeader
          title={t("title")}
          subtitle={t("subtitle")}
          onClose={onClose}
        />

        <SheetBody className="max-h-[70vh] space-y-5">
          {/* Price Range */}
          <div className="space-y-3">
            <Label className={appFieldLabelClass}>{t("budgetRange")}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">{t("min")}</span>
                <Input
                  type="number"
                  placeholder={t("rwfPlaceholder")}
                  value={filters.minPrice || ""}
                  onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) || undefined })}
                  className={appInputClass}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">{t("max")}</span>
                <Input
                  type="number"
                  placeholder={t("rwfPlaceholder")}
                  value={filters.maxPrice || ""}
                  onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                  className={appInputClass}
                />
              </div>
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-3">
            <Label className={appFieldLabelClass}>{t("serviceType")}</Label>
            <Select
              value={filters.serviceType || "all"}
              onValueChange={(value) => setFilters({ ...filters, serviceType: value === "all" ? undefined : value })}
            >
              <SelectTrigger className={cn(appInputClass, "w-full")}>
                <SelectValue placeholder={t("allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTypes")}</SelectItem>
                <SelectItem value="INDIVIDUAL">{t("individual")}</SelectItem>
                <SelectItem value="COMPANY">{t("company")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Availability */}
          <div className="space-y-3">
            <Label className={appFieldLabelClass}>{t("availability")}</Label>
            <Select
              value={filters.availability || "all"}
              onValueChange={(value) => setFilters({ ...filters, availability: value === "all" ? undefined : value })}
            >
              <SelectTrigger className={cn(appInputClass, "w-full")}>
                <SelectValue placeholder={t("anyAvailability")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("anyAvailability")}</SelectItem>
                <SelectItem value="available">{t("available")}</SelectItem>
                <SelectItem value="unavailable">{t("unavailable")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Area and Distance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className={appFieldLabelClass}>{t("area")}</Label>
              <Select
                value={filters.location || "all"}
                onValueChange={(value) => setFilters({ ...filters, location: value === "all" ? undefined : value })}
              >
                <SelectTrigger className={cn(appInputClass, "w-full")}>
                  <SelectValue placeholder={t("anyArea")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("anyArea")}</SelectItem>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className={appFieldLabelClass}>{t("distance")}</Label>
              <Select
                value={filters.distanceKm?.toString() || "all"}
                onValueChange={(value) => setFilters({ ...filters, distanceKm: value === "all" ? undefined : Number(value) })}
              >
                <SelectTrigger className={cn(appInputClass, "w-full")}>
                  <SelectValue placeholder={t("anyDistance")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("anyDistance")}</SelectItem>
                  <SelectItem value="2">{t("km", { count: 2 })}</SelectItem>
                  <SelectItem value="5">{t("km", { count: 5 })}</SelectItem>
                  <SelectItem value="10">{t("km", { count: 10 })}</SelectItem>
                  <SelectItem value="25">{t("km", { count: 25 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="flex items-center gap-3">
          <AppButton appVariant="secondary" onClick={handleReset} className="flex-1">
            {t("reset")}
          </AppButton>
          <AppButton onClick={handleApply} className="flex-1">
            {t("apply")}
          </AppButton>
        </SheetFooter>
      </SheetPanel>
    </>
  );
};

export default FilterModal;
