"use client";

import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  searchIcon?: React.ReactNode;
  className?: string;
  initialQuery?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const defaultProps: Partial<SearchBarProps> = {
  placeholder: "Search...",
  searchIcon: (
    <Icons.SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 fill-[#878787]" />
  ),
};

const SearchBar = ({
  onSearch,
  placeholder = defaultProps.placeholder,
  searchIcon = defaultProps.searchIcon,
  className = "",
  initialQuery = "",
  onFocus,
  onBlur,
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [isActive, setIsActive] = useState(false);

  const handleFocus = () => {
    setIsActive(true);
    onFocus?.();
    if (query) onSearch(query);
  };

  const handleBlur = () => {
    setIsActive(false);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);
    onSearch(nextQuery);
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        <motion.div
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 1, opacity: isActive ? 1 : 0.95 }}
          exit={{ scale: 1, opacity: 0.9 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="relative"
        >
          {searchIcon}
          <Input
            type="text"
            placeholder={placeholder}
            className="h-12 rounded-2xl border-[#DDE3DD] bg-white pl-11 pr-4 text-[14px] font-medium text-[#1B2431] shadow-sm transition-all placeholder:text-[13px] placeholder:font-medium placeholder:text-[#7A827A] focus-visible:ring-2 focus-visible:ring-[#145B10]/20"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-label="Search services"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
