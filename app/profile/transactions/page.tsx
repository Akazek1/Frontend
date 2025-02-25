"use client";

import React from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { useRouter, useSearchParams } from "next/navigation";

const Transaction = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "earned"; // Default to "earned"

  // Function to update the URL with the selected tab
  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="bg-[#F1FCEF]">
      {/* Header */}
      <BackButtonHeader text="Transaction" className="p-6" />

      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-green-800">
        <button
          onClick={() => setTab("earned")}
          className={`py-2 px-4 text-lg font-medium w-[50%] ${
            currentTab === "earned"
              ? "text-green-800 border-b-2 border-green-800"
              : "text-gray-500"
          }`}
        >
          Earned
        </button>
        <button
          onClick={() => setTab("spend")}
          className={`py-2 px-4 text-lg font-medium w-[50%] ${
            currentTab === "spend"
              ? "text-green-800 border-b-2 border-green-800"
              : "text-gray-500"
          }`}
        >
          Spend
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {currentTab === "earned" ? (
          <p>Content for Earned transactions will go here.</p>
        ) : (
          <p>Content for Spend transactions will go here.</p>
        )}
      </div>
    </div>
  );
};

export default Transaction;
