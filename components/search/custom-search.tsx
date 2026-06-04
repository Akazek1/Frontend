"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";


interface CustomSearchProps {
    onSearch: (query: string) => void; 
    placeholder?: string; 
    className?: string; 
}

const defaultProps: Partial<CustomSearchProps> = {
    placeholder: "Search...",
};

const CustomSearch = ({
    onSearch,
    placeholder = defaultProps.placeholder,
    className = "",
}: CustomSearchProps) => {
    const [query, setQuery] = useState("");
    const [isActive, setIsActive] = useState(false);

    const handleFocus = () => {
        setIsActive(true);
    };

    const handleBlur = () => {
        setIsActive(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        onSearch(newQuery); 
    };

    return (
        <div className={`relative ${className}`}>
            <AnimatePresence>
                <motion.div
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: isActive ? 1 : 1, opacity: isActive ? 1 : 0.8 }}
                    exit={{ scale: 1, opacity: 0.8 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative"
                >
                    <Icons.SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 fill-[#878787]" />
                    <Input
                        type="text"
                        placeholder={placeholder}
                        className={cn(
                            "h-12 rounded-full border-[#DCE8D9] bg-white pl-11 pr-4 text-[14px] font-semibold shadow-sm placeholder:text-[13px] placeholder:font-semibold placeholder:text-[#878787] focus-visible:ring-brand/20",
                        )}
                        value={query}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                    {/* <Icons.FilerIcon className="absolute right-4 top-3 w-[18px] h-[18px] fill-brand" /> */}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CustomSearch;
