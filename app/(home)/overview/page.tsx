"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/header/header";
import GuestHeader from "@/components/header/guest-header";
import Categories from "@/components/home/category-scroller";
import PromoBanner from "@/components/home/promo-banner";
import SearchResults from "@/components/search/search-result";
import SearchBar from "@/components/search/search";
import ServiceProvider from "@/components/home/service-providers";
import PostJobBanner from "@/components/home/post-job-banner";
import JobPostingsFeed from "@/components/home/job-postings-feed";
import ViewModeToggle from "@/components/view-mode-toggle";
import TutorialModal from "@/components/tutorial-modal";
import { useViewMode } from "@/context/view-mode-context";
import { useAuth } from "@/hooks/useAuth";
import { isGuestBrowsingEnabled } from "@/lib/feature-flags";
import { SlidersHorizontal } from "lucide-react";
import { colors } from "@/constant/colors";


const HomeContent = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFiltersOnSearch, setOpenFiltersOnSearch] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const { viewMode } = useViewMode();
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated && isGuestBrowsingEnabled();
  const searchParams = useSearchParams();

  const headerRef = React.useRef<HTMLDivElement>(null);

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


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setOpenFiltersOnSearch(false);
    setIsSearching(true);
  };

  const handleFilterClick = () => {
    setOpenFiltersOnSearch(true);
    setIsSearching(true);
  };

  const handleBack = () => {
    setIsSearching(false);
    setSearchQuery("");
    setOpenFiltersOnSearch(false);
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
        {!isSearching && (
          <div className="flex items-center gap-2.5">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search by provider name, service, category..."
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={handleFilterClick}
              className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-[#DDE3DD] bg-white px-4 shadow-sm transition active:scale-95 hover:border-[#145B10] hover:bg-[#F1F8F1]"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-[18px] w-[18px] text-[#145B10]" />
              <span className="text-[13px] font-bold text-[#1B2431]">Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable content — banner, categories and cards scroll away and back */}
      <div className="px-3 sm:px-6 pb-24 space-y-5 mt-2">
        {isSearching ? (
          <SearchResults query={searchQuery} onBack={handleBack} initialFilterOpen={openFiltersOnSearch} />
        ) : viewMode === "employer" ? (
          <>
            <PromoBanner />
            <PostJobBanner />
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
