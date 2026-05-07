import React from "react";
import { MessageSquareText } from "lucide-react";

const ChatHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#145B10] shadow-sm">
          <MessageSquareText className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-[22px] font-bold leading-tight text-[#1B2431]">Messages</h1>
          <p className="text-[12px] leading-4 text-[#757575]">Chat around bookings and job requests</p>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
