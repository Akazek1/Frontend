"use client";

import React, { useState } from "react";
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
  minRating?: number;
}

const LOCATIONS = ["Kicukiro", "Nyarugenge", "Gasabo", "Kigali", "Remera"];

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, initialFilters }) => {
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
          title="Filters"
          subtitle="Narrow down job results."
          onClose={onClose}
        />

        <SheetBody className="max-h-[70vh] space-y-5">
          {/* Price Range */}
          <div className="space-y-3">
            <Label className={appFieldLabelClass}>Budget range (RWF)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Min</span>
                <Input
                  type="number"
                  placeholder="RWF"
                  value={filters.minPrice || ""}
                  onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) || undefined })}
                  className={appInputClass}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Max</span>
                <Input
                  type="number"
                  placeholder="RWF"
                  value={filters.maxPrice || ""}
                  onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                  className={appInputClass}
                />
              </div>
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-3">
            <Label className={appFieldLabelClass}>Service Type</Label>
            <Select
              value={filters.serviceType || "all"}
              onValueChange={(value) => setFilters({ ...filters, serviceType: value === "all" ? undefined : value })}
            >
              <SelectTrigger className={cn(appInputClass, "w-full")}>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="AGENCY">Agency</SelectItem>
                <SelectItem value="COMPANY">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Availability */}
          <div className="space-y-3">
            <Label className={appFieldLabelClass}>Availability</Label>
            <Select
              value={filters.availability || "all"}
              onValueChange={(value) => setFilters({ ...filters, availability: value === "all" ? undefined : value })}
            >
              <SelectTrigger className={cn(appInputClass, "w-full")}>
                <SelectValue placeholder="Any Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Availability</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Area and Distance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className={appFieldLabelClass}>Area</Label>
              <Select
                value={filters.location || "all"}
                onValueChange={(value) => setFilters({ ...filters, location: value === "all" ? undefined : value })}
              >
                <SelectTrigger className={cn(appInputClass, "w-full")}>
                  <SelectValue placeholder="Any Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Area</SelectItem>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className={appFieldLabelClass}>Distance</Label>
              <Select
                value={filters.distanceKm?.toString() || "all"}
                onValueChange={(value) => setFilters({ ...filters, distanceKm: value === "all" ? undefined : Number(value) })}
              >
                <SelectTrigger className={cn(appInputClass, "w-full")}>
                  <SelectValue placeholder="Any Distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Distance</SelectItem>
                  <SelectItem value="2">2 km</SelectItem>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label className={appFieldLabelClass}>Minimum Rating</Label>
            <Select
              value={filters.minRating?.toString() || "0"}
              onValueChange={(value) => setFilters({ ...filters, minRating: Number(value) || undefined })}
            >
              <SelectTrigger className={cn(appInputClass, "w-full")}>
                <SelectValue placeholder="Any Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Rating</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.0">4.0+ Stars</SelectItem>
                <SelectItem value="3.5">3.5+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SheetBody>

        <SheetFooter className="flex items-center gap-3">
          <AppButton appVariant="secondary" onClick={handleReset} className="flex-1">
            Reset
          </AppButton>
          <AppButton onClick={handleApply} className="flex-1">
            Apply
          </AppButton>
        </SheetFooter>
      </SheetPanel>
    </>
  );
};

export default FilterModal;
