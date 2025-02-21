"use client";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Keep Framer Motion for animation (optional, if you want to animate the search bar)

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(false); // Track if the search bar is focused

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query);
      }
    }, 300); // 300ms debounce delay for actual typing (optional, can remove if not needed)

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleFocus = () => {
    setIsActive(true);
    onSearch(""); // Trigger search results immediately with an empty query
  };

  const handleBlur = () => {
    setIsActive(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: isActive ? 1.05 : 1, opacity: isActive ? 1 : 0.8 }}
          exit={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative"
        >
          <Icons.SearchIcon className="absolute left-3 top-3 w-4 h-4 fill-[#878787]" />
          <Input
            type="text"
            placeholder="Search baby sitter, carpenter etc"
            className="pl-10 border-[#D6D6D6] rounded-[40px] placeholder:text-xs placeholder:text-[#878787]"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <Icons.FilerIcon className="absolute right-4 top-3 w-[18px] h-[18px] fill-[#145B10]" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
