"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { Suspense } from "react";
import ChatRoom from "@/components/chat/chat-room";

/**
 * Client-side room for a unified conversation (agency, company, …). Renders the
 * SAME ChatRoom as booking chats — one design, one feature set.
 */
const ConversationRoomPage = () => {
  const params = useParams();
  const t = useTranslations("chatRoom");
  const id = params.id as string;

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      {/* Chat rooms hide the bottom nav, so this route owns the whole viewport. */}
      <div className="h-dvh">
        <ChatRoom conversationId={id} />
      </div>
    </Suspense>
  );
};

export default ConversationRoomPage;
