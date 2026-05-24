"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Filter Services</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-700">Price Range (RWF)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Min</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice || ""}
                  onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) || undefined })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Max</span>
                <Input
                  type="number"
                  placeholder="50,000+"
                  value={filters.maxPrice || ""}
                  onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-700">Service Type</Label>
            <Select
              value={filters.serviceType || "all"}
              onValueChange={(value) => setFilters({ ...filters, serviceType: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="w-full rounded-xl border-gray-200">
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
            <Label className="text-sm font-bold text-gray-700">Availability</Label>
            <Select
              value={filters.availability || "all"}
              onValueChange={(value) => setFilters({ ...filters, availability: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="w-full rounded-xl border-gray-200">
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
              <Label className="text-sm font-bold text-gray-700">Area</Label>
              <Select
                value={filters.location || "all"}
                onValueChange={(value) => setFilters({ ...filters, location: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="w-full rounded-xl border-gray-200">
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
              <Label className="text-sm font-bold text-gray-700">Distance</Label>
              <Select
                value={filters.distanceKm?.toString() || "all"}
                onValueChange={(value) => setFilters({ ...filters, distanceKm: value === "all" ? undefined : Number(value) })}
              >
                <SelectTrigger className="w-full rounded-xl border-gray-200">
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
            <Label className="text-sm font-bold text-gray-700">Minimum Rating</Label>
            <Select
              value={filters.minRating?.toString() || "0"}
              onValueChange={(value) => setFilters({ ...filters, minRating: Number(value) || undefined })}
            >
              <SelectTrigger className="w-full rounded-xl border-gray-200">
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
        </div>

        <div className="p-4 bg-gray-50 flex items-center gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1 rounded-xl h-12 font-bold">
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 rounded-xl h-12 bg-[#145B10] hover:bg-[#0F4D0C] font-bold">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
