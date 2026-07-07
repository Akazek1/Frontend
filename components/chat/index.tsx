"use client";
import React, { useState } from "react";
import ChatHeader from "./chat-header";
import CustomSearch from "../search/custom-search";
import ChatTabs from "./chat-tabs";
import ChatInbox from "./chat-inbox";
import { PageShell, appContentClass, appStickyHeaderClass } from "@/components/ui/app-primitives";

export interface InboxCounts {
  all: number;
  read: number;
  unread: number;
  archive: number;
  /** Archived bookings where the current user still owes a review. */
  archiveReviewPending: number;
}

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState<InboxCounts>({ all: 0, read: 0, unread: 0, archive: 0, archiveReviewPending: 0 });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <PageShell padded={false}>
      {/* Sticky header area */}
      <div className={`${appStickyHeaderClass} space-y-4`}>
        <ChatHeader />
        <CustomSearch
          onSearch={handleSearch}
          placeholder="Search employers, workers or jobs"
        />
        <ChatTabs counts={counts} />
      </div>

      {/* Chat inbox — flows normally within PageShell; the single outer
          pwa-layout <main> (overflow-y-auto) is the only scroll container,
          same as every other list page (e.g. Work). No nested flex-1/
          overflow-y-auto wrapper here — that fought with the outer scroll
          and caused cards to visually clip before reaching the nav bar. */}
      <div className={`${appContentClass} px-4 pt-4`}>
        <ChatInbox searchQuery={searchQuery} onCounts={setCounts} />
      </div>
    </PageShell>
  );
};

export default Chat;
