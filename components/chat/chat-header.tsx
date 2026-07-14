import React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/app-primitives";

const ChatHeader = () => {
  const t = useTranslations("chatInbox");
  return (
    <PageHeader title={t("messagesTitle")} subtitle={t("messagesSubtitle")} />
  );
};

export default ChatHeader;
