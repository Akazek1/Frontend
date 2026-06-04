"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import from shadcn/ui
import type { InboxCounts } from "./index";

interface ChatTabsProps {
  onTabChange?: (tab: string) => void; // Optional callback for external components
  counts?: InboxCounts;
}

const triggerClass =
  "group flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[12px] font-bold shadow-none data-[state=active]:bg-brand data-[state=active]:text-white data-[state=inactive]:text-gray-500";

const ChatTabs = ({ onTabChange, counts }: ChatTabsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const validTabs = ["All", "Read", "Unread", "Archive"];
  const currentTab = validTabs.includes(searchParams.get("tab") ?? "") ? searchParams.get("tab")! : "All";

  // Function to update the URL with the selected tab
  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
    onTabChange?.(tab); // Notify external components of tab change
  };

  return (
    <div>
      <Tabs value={currentTab} onValueChange={setTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-4 rounded-full bg-white p-1 shadow-sm">
          <TabsTrigger value="All" className={triggerClass}>
            All
            {counts && counts.all > 0 ? (
              <span className="min-w-[18px] rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 group-data-[state=active]:bg-white group-data-[state=active]:text-brand">
                {counts.all}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="Read" className={triggerClass}>
            Read
          </TabsTrigger>
          <TabsTrigger value="Unread" className={triggerClass}>
            Unread
            {counts && counts.unread > 0 ? (
              <span className="min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {counts.unread}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="Archive" className={triggerClass}>
            Archive
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ChatTabs;
