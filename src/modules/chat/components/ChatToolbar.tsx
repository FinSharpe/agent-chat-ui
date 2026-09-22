"use client";

import { PanelLeft, Plus } from "lucide-react";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useUiStore } from "@/store/useUiStore";

/**
 * The phone layout's slim bar over the conversation: chat history on the
 * left, a new chat on the right. Desktop has both in the sidebar instead.
 */
export default function ChatToolbar() {
  const { createNewChat } = useAppNavigation();

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-50 px-4 py-2">
      <button
        type="button"
        onClick={() => useUiStore.getState().setHistoryDrawerOpen(true)}
        className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
        title="Chat history"
        aria-label="Chat history"
      >
        <PanelLeft size={15} />
      </button>
      <span className="text-[11px] font-medium text-slate-400">
        Conversations
      </span>
      <button
        type="button"
        onClick={() => createNewChat()}
        className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#063BAA] transition-colors"
        title="New chat"
        aria-label="New chat"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
