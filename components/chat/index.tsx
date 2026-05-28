"use client";
import React, { useState } from "react";
import ChatHeader from "./chat-header";
import CustomSearch from "../search/custom-search";
import ChatTabs from "./chat-tabs";
import ChatInbox from "./chat-inbox";

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
    <div className="flex min-h-screen flex-col bg-[#F1FCEF]">
      {/* Sticky header area */}
      <div className="sticky top-0 z-10 space-y-4 bg-[#F1FCEF] p-4 pb-3 shadow-sm sm:p-6">
        <ChatHeader />
        <CustomSearch
          onSearch={handleSearch}
          placeholder="Search employers, workers or jobs"
        />
        <ChatTabs counts={counts} />
      </div>

      {/* Scrollable chat inbox */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3 sm:px-6">
        <ChatInbox searchQuery={searchQuery} onCounts={setCounts} />
      </div>
    </div>
  );
};

export default Chat;
