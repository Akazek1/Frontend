"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/header/header";
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


const HomeContent = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const { viewMode } = useViewMode();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("tutorial") === "true") {
      setShowTutorial(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
  };

  const handleBack = () => {
    setIsSearching(false);
    setSearchQuery("");
  };

  return (
    <>
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Sticky top bar — header, role toggle, search always visible */}
      <div className="sticky top-0 z-20 bg-[#F1FCEF] px-3 sm:px-6 pt-3 pb-3 space-y-3 shadow-sm">
        <Header />
        <ViewModeToggle />
        {!isSearching && (
          <SearchBar
            onSearch={handleSearch}
            placeholder={
              viewMode === "employer"
                ? "Search baby sitter, carpenter etc"
                : "Search job postings…"
            }
          />
        )}
      </div>

      {/* Scrollable content — banner, categories and cards scroll away and back */}
      <div className="px-3 sm:px-6 pb-24 space-y-5 mt-2">
        {isSearching ? (
          <SearchResults query={searchQuery} onBack={handleBack} />
        ) : viewMode === "employer" ? (
          <>
            <PromoBanner />
            <PostJobBanner />
            <Categories />
            <ServiceProvider showHeader={true} />
          </>
        ) : (
          <JobPostingsFeed />
        )}
      </div>
    </>
  );
};

export default HomeContent;
