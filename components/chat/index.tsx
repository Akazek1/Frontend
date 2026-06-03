"use client";
import React, { useState } from "react";
import ChatHeader from "./chat-header";
import CustomSearch from "../search/custom-search";
import ChatTabs from "./chat-tabs";
import ChatInbox from "./chat-inbox";
import { appContentClass } from "@/components/ui/app-primitives";

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
    <div className="app-bg mx-auto flex min-h-dvh w-full max-w-[428px] flex-col">
      {/* Sticky header area */}
      <div className="app-bg sticky top-0 z-10 space-y-4 px-4 pb-3 pt-6 shadow-sm backdrop-blur">
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
    </div>
  );
};

export default Chat;
