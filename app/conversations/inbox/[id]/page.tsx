"use client";

import ChatRoom from "@/components/chat/chat-room";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { Suspense } from "react";

const ChatPage = () => {
  const params = useParams();
  const t = useTranslations("chatRoom");
  const id = params.id as string;

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <ChatRoom bookingId={id} />
    </Suspense>
  );
};

export default ChatPage;
