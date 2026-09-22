"use client";

import { Thread } from "@/components/thread";
import { ArtifactProvider } from "@/components/thread/artifact";

/**
 * Chat (`/`). The shell gives the page a full-height slot; Thread owns its
 * scrolling inside it, so nothing here sizes against the window.
 */
export default function ChatPage() {
  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
      <ArtifactProvider>
        <Thread />
      </ArtifactProvider>
    </div>
  );
}
