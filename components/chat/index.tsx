"use client";
import React, { useState } from "react";
import ChatHeader from "./chat-header";
import CustomSearch from "../search/custom-search"; 
import ChatTabs from "./chat-tabs";
import ChatInbox from "./chat-inbox";

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState(""); 

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
          placeholder="Search messages or services"
        />
        <ChatTabs />
      </div>

      {/* Scrollable chat inbox */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-3 sm:px-6">
        <ChatInbox searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Chat;
