"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/header/header";
import GuestHeader from "@/components/header/guest-header";
import Categories from "@/components/home/category-scroller";
import PromoBanner from "@/components/home/promo-banner";
import SearchResults from "@/components/search/search-result";
import ServiceProvider from "@/components/home/service-providers";
import JobPostingsFeed from "@/components/home/job-postings-feed";
import ViewModeToggle from "@/components/view-mode-toggle";
import TutorialModal from "@/components/tutorial-modal";
import { useViewMode } from "@/context/view-mode-context";
import { useAuth } from "@/hooks/useAuth";
import { isGuestBrowsingEnabled } from "@/lib/feature-flags";
import { SlidersHorizontal, X } from "lucide-react";
import { colors } from "@/constant/colors";
import { Icons } from "@/components/icons";


const HomeContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const { viewMode } = useViewMode();
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated && isGuestBrowsingEnabled();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const headerRef = React.useRef<HTMLDivElement>(null);
  const isSearching = searchQuery.trim().length > 0 || showPanel;

  useEffect(() => {
    if (searchParams.get("tutorial") === "true") {
      setShowTutorial(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Handle sticky header with scroll — registered once, avoids re-registration on state change
  useEffect(() => {
    const mainElement = document.querySelector("main") as HTMLElement;
    if (!mainElement) return;

    const handleScroll = () => {
      if (!headerRef.current) return;
      const shouldBeSticky = mainElement.scrollTop > 30;
      setIsHeaderSticky((prev) => (prev === shouldBeSticky ? prev : shouldBeSticky));
    };

    mainElement.addEventListener("scroll", handleScroll);
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, []);


  const handleFilterClick = () => {
    setShowPanel(true);
    setFilterTrigger((n) => n + 1);
  };

  const handleClear = () => {
    setSearchQuery("");
    setShowPanel(false);
    searchInputRef.current?.focus();
  };

  const headerStyle: React.CSSProperties = isHeaderSticky
    ? {
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        backgroundColor: colors.background,
      }
    : {
        backgroundColor: colors.background,
      };

  return (
    <>
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Sticky header with search and view toggle */}
      <div 
        ref={headerRef} 
        className="px-3 sm:px-6 pt-3 pb-3 space-y-3 shadow-sm transition-shadow duration-300"
        style={headerStyle}
      >
        {isGuest ? <GuestHeader /> : <Header />}
        <ViewModeToggle />
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <Icons.SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 fill-[#878787]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewMode === "provider"
                  ? "Search jobs by title, category..."
                  : "Search by provider name, service, category..."
              }
              className="h-12 w-full rounded-2xl border border-[#DDE3DD] bg-white pl-11 pr-10 text-[14px] font-medium text-ink shadow-sm outline-none transition placeholder:text-[13px] placeholder:font-medium placeholder:text-[#7A827A] focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            {(searchQuery || showPanel) && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#7A827A] hover:bg-gray-100"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleFilterClick}
            className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-[#DDE3DD] bg-white px-4 shadow-sm transition active:scale-95 hover:border-brand hover:bg-[#F1F8F1]"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-[18px] w-[18px] text-brand" />
            <span className="text-[13px] font-bold text-ink">Filter</span>
          </button>
        </div>
      </div>

      {/* Scrollable content — banner, categories and cards scroll away and back */}
      <div className="px-3 sm:px-6 pb-24 space-y-5 mt-2">
        {isSearching ? (
          <SearchResults
            query={searchQuery}
            onQueryChange={setSearchQuery}
            mode={viewMode}
            filterTrigger={filterTrigger}
            onExitPanel={() => setShowPanel(false)}
          />
        ) : viewMode === "employer" ? (
          <>
            <PromoBanner />
            <Categories />
            <ServiceProvider showHeader={true} />
          </>
        ) : (
          <>
            <Categories />
            <JobPostingsFeed />
          </>
        )}
      </div>
    </>
  );
};

export default HomeContent;
