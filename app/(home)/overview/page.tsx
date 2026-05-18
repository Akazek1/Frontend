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
import { colors } from "@/constant/colors";


const HomeContent = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const { viewMode } = useViewMode();
  const searchParams = useSearchParams();

  const headerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("tutorial") === "true") {
      setShowTutorial(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Handle sticky header with scroll
  useEffect(() => {
    const mainElement = document.querySelector("main") as HTMLElement;
    if (!mainElement) return;

    const handleScroll = () => {
      if (!headerRef.current) return;

      const scrollTop = mainElement.scrollTop;
      const shouldBeSticky = scrollTop > 30;
      
      if (shouldBeSticky && !isHeaderSticky) {
        setIsHeaderSticky(true);
      } else if (!shouldBeSticky && isHeaderSticky) {
        setIsHeaderSticky(false);
      }
    };

    mainElement.addEventListener("scroll", handleScroll);
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [isHeaderSticky]);


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
  };

  const handleBack = () => {
    setIsSearching(false);
    setSearchQuery("");
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
        <Header />
        <ViewModeToggle />
        {!isSearching && (
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search job postings, employers, categories..."
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
