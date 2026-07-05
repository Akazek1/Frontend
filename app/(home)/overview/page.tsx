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
  const [isStickyClusterActive, setIsStickyClusterActive] = useState(false);
  const [isSearchLocked, setIsSearchLocked] = useState(false);
  const [isCategoriesLocked, setIsCategoriesLocked] = useState(false);
  const [searchHeight, setSearchHeight] = useState(68);
  const [categoriesHeight, setCategoriesHeight] = useState(128);
  const { viewMode } = useViewMode();
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated && isGuestBrowsingEnabled();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchShellRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const categoriesShellRef = useRef<HTMLDivElement>(null);
  const categoriesBarRef = useRef<HTMLDivElement>(null);

  const isSearching = searchQuery.trim().length > 0 || showPanel;

  useEffect(() => {
    if (searchParams.get("tutorial") === "true") {
      setShowTutorial(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Lock the search row once it touches the top of the scroll container.
  useEffect(() => {
    const mainElement = document.querySelector("main") as HTMLElement;
    if (!mainElement) return;

    const updateStickyState = () => {
      const shell = searchShellRef.current;
      const bar = searchBarRef.current;
      if (!shell || !bar) return;

      const nextHeight = Math.ceil(bar.getBoundingClientRect().height);
      setSearchHeight((prev) => (prev === nextHeight ? prev : nextHeight));

      const shouldLock = mainElement.scrollTop >= shell.offsetTop;
      setIsSearchLocked((prev) => (prev === shouldLock ? prev : shouldLock));
      setIsStickyClusterActive((prev) => (prev === shouldLock ? prev : shouldLock));

      const categoriesShell = categoriesShellRef.current;
      const categoriesBar = categoriesBarRef.current;
      if (categoriesShell && categoriesBar) {
        const nextCategoriesHeight = Math.ceil(categoriesBar.getBoundingClientRect().height);
        setCategoriesHeight((prev) =>
          prev === nextCategoriesHeight ? prev : nextCategoriesHeight
        );

        const shouldLockCategories =
          mainElement.scrollTop >= categoriesShell.offsetTop - nextHeight;
        setIsCategoriesLocked((prev) =>
          prev === shouldLockCategories ? prev : shouldLockCategories
        );
      } else {
        setIsCategoriesLocked(false);
      }
    };

    updateStickyState();
    mainElement.addEventListener("scroll", updateStickyState, { passive: true });
    window.addEventListener("resize", updateStickyState);
    return () => {
      mainElement.removeEventListener("scroll", updateStickyState);
      window.removeEventListener("resize", updateStickyState);
    };
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

  return (
    <>
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Intro header scrolls away before the search/category cluster pins. */}
      <div className="px-3 sm:px-6 pt-3 pb-3 space-y-3" style={{ backgroundColor: colors.background }}>
        {isGuest ? <GuestHeader /> : <Header />}
        <ViewModeToggle />
      </div>

      <div
        ref={searchShellRef}
        data-home-sticky-search
        data-home-search-locked={isSearchLocked ? "true" : "false"}
        className="relative"
        style={{ minHeight: isSearchLocked ? searchHeight : undefined }}
      >
        <div
          ref={searchBarRef}
          className={`z-40 w-full max-w-[428px] px-3 pb-3 pt-2 sm:px-6 transition-shadow duration-200 ${
            isSearchLocked ? "fixed left-1/2 top-0 -translate-x-1/2" : "relative"
          } ${isStickyClusterActive ? "shadow-[0_8px_18px_rgba(20,91,16,0.08)]" : "shadow-sm"}`}
          style={{ backgroundColor: colors.background }}
        >
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
                className="h-10 w-full rounded-2xl border border-[#DDE3DD] bg-white pl-10 pr-9 text-[14px] font-medium text-ink shadow-sm outline-none transition placeholder:text-[13px] placeholder:font-medium placeholder:text-[#7A827A] focus:border-brand focus:ring-2 focus:ring-brand/20"
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
              className="flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-[#DDE3DD] bg-white px-3.5 shadow-sm transition active:scale-95 hover:border-brand hover:bg-[#F1F8F1]"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4 text-brand" />
              <span className="text-[13px] font-bold text-ink">Filter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-6 pt-2">
        {!isSearching && viewMode === "employer" && <PromoBanner />}
      </div>

      {!isSearching && viewMode === "employer" && (
        <div
          ref={categoriesShellRef}
          data-home-sticky-categories
          data-home-categories-locked={isCategoriesLocked ? "true" : "false"}
          className="relative"
          style={{ minHeight: isCategoriesLocked ? categoriesHeight : undefined }}
        >
          <div
            ref={categoriesBarRef}
            className={`z-30 w-full max-w-[428px] px-3 pb-3 pt-2 sm:px-6 ${
              isCategoriesLocked ? "fixed left-1/2 -translate-x-1/2" : "relative"
            }`}
            style={{ backgroundColor: colors.background, top: isCategoriesLocked ? searchHeight : undefined }}
          >
            <Categories />
          </div>
        </div>
      )}

      {/* Scrollable content — banner and cards scroll away while sticky controls stay available. */}
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
            <ServiceProvider showHeader={true} />
          </>
        ) : (
          <>
            <JobPostingsFeed />
          </>
        )}
      </div>
    </>
  );
};

export default HomeContent;
