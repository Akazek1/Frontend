"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AgencyPageHeader } from "@/components/agency/agency-ui";
import {
  ConversationEmpty,
  ConversationRow,
  ConversationRowSkeleton,
  type ConversationRowData,
} from "@/components/chat/conversation-row";
import { ConversationSummary, listConversations } from "@/lib/conversations";
import { usePresenceMap } from "@/hooks/usePresenceMap";
import { useSocketEvent } from "@/hooks/useSocketEvent";

export default function AgencyMessagesPage() {
  const t = useTranslations("agencyMessages");
  const tInbox = useTranslations("chatInbox");
  // Same "Client" string the chat room header uses — one label, one place.
  const tRoom = useTranslations("chatRoom");
  const router = useRouter();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    listConversations()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live inbox: any new message or read-receipt refreshes previews and badges.
  useSocketEvent("conversationMessage", load);
  useSocketEvent("conversationRead", load);

  const presence = usePresenceMap(
    useMemo(() => items.map((c) => c.otherUserId ?? "").filter(Boolean), [items]),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 lg:px-6">
      <AgencyPageHeader title={t("title")} subtitle={t("subtitle")} />

      {loading ? (
        <ConversationRowSkeleton />
      ) : items.length === 0 ? (
        <ConversationEmpty title={t("emptyTitle")} hint={t("emptyHint")} />
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const last = c.lastMessage;
            const row: ConversationRowData = {
              id: c.id,
              name: c.title,
              avatarUrl: c.avatarUrl,
              isVerified: c.otherIsVerified,
              // Orgs have no presence; only show the dot for a person.
              isOnline: c.otherUserId ? Boolean(presence[c.otherUserId]) : undefined,
              label: tRoom("client"),
              // An inquiry thread has no booking lifecycle, so no status pill.
              pill: null,
              timestamp: last?.createdAt || c.updatedAt,
              preview: last?.content || tInbox("noMessagesYet"),
              isUnread: c.unreadCount > 0,
              ownReceipt: last?.mine
                ? last.isRead
                  ? "read"
                  : last.isDelivered
                    ? "delivered"
                    : "sent"
                : null,
              unreadCount: c.unreadCount,
            };
            return (
              <ConversationRow
                key={c.id}
                data={row}
                onClick={() => router.push(`/agency/messages/${c.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
