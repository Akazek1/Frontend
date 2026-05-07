"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import from shadcn/ui

interface ChatTabsProps {
  onTabChange?: (tab: string) => void; // Optional callback for external components
}

const ChatTabs = ({ onTabChange }: ChatTabsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const validTabs = ["All", "Read", "Unread"];
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
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-full bg-white p-1 shadow-sm">
          <TabsTrigger
            value="All"
            className="rounded-full px-3 py-2 text-[12px] font-bold shadow-none data-[state=active]:bg-[#145B10] data-[state=active]:text-white data-[state=inactive]:text-gray-500"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="Read"
            className="rounded-full px-3 py-2 text-[12px] font-bold shadow-none data-[state=active]:bg-[#145B10] data-[state=active]:text-white data-[state=inactive]:text-gray-500"
          >
            Read
          </TabsTrigger>
          <TabsTrigger
            value="Unread"
            className="rounded-full px-3 py-2 text-[12px] font-bold shadow-none data-[state=active]:bg-[#145B10] data-[state=active]:text-white data-[state=inactive]:text-gray-500"
          >
            Unread
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ChatTabs;
