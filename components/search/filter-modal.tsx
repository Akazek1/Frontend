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
  minRating?: number;
}

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
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>
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
