"use client";

import ChatRoom from "@/components/chat/chat-room";
import { useParams } from "next/navigation";
import React, { Suspense } from "react";

const ChatPage = () => {
  const params = useParams();
  const id = params.id as string;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatRoom bookingId={id} />
    </Suspense>
  );
};

export default ChatPage;
