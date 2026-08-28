"use client";

import { useParams } from "next/navigation";
import React, { Suspense } from "react";
import ChatRoom from "@/components/chat/chat-room";

/**
 * Agency-side conversation room — the SAME ChatRoom the rest of the app uses,
 * so reply, reactions, edit, unsend and receipts are identical here.
 */
const AgencyMessageThreadPage = () => {
  const params = useParams();
  const id = params.id as string;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* The agency shell grows with content (min-h-dvh), so ChatRoom's
          `h-full` has no bounded parent — the message list would never scroll
          and the composer would drift down the page. The negative margins undo
          the shell's own page padding (py-5 / lg:py-8), which would otherwise
          push the room past the viewport and make the whole page scroll.
          56px = agency topbar. */}
      <div className="-mx-4 -my-5 h-[calc(100dvh-56px)] lg:-mx-8 lg:-my-8">
        <ChatRoom conversationId={id} />
      </div>
    </Suspense>
  );
};

export default AgencyMessageThreadPage;
