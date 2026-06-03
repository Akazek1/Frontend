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
}

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState<InboxCounts>({ all: 0, read: 0, unread: 0, archive: 0 });

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

      {/* Scrollable chat inbox */}
      <div className={`${appContentClass} flex-1 overflow-y-auto px-4 pb-24 pt-4`}>
        <ChatInbox searchQuery={searchQuery} onCounts={setCounts} />
      </div>
    </PageShell>
  );
};

export default Chat;
