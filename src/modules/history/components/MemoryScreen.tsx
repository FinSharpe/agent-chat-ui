"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { PageLoaderSwitch } from "@/components/shared/PageLoader";
import { ScreenFooter, SectionBanner } from "@/components/shared/SectionKit";
import {
  MEMORY_BANNER_HEIGHT,
  MEMORY_BANNERS,
  MEMORY_COPY,
  MEMORY_FOOTER_TAGLINE,
} from "../constants/memory-content";
import type { ChatSummary } from "../hooks/useChatHistory";
import { useMemoryChats } from "../hooks/useMemoryChats";
import BookmarkedChats from "./BookmarkedChats";
import ChatHistorySection from "./ChatHistorySection";

/**
 * The Memory tab: the memory banner, the bookmarked chats, a second banner
 * breaking into the full searchable history, and the wave footer. The page
 * owns its scrolling — the shell's main panel does not scroll.
 *
 * The first load is a full-page wait, as mobile's `memory_tab.dart` (#153):
 * the page loader fills the body until the list answers or fails. A
 * background refresh keeps the rows it already has.
 */
export default function MemoryScreen() {
  const isDesktopWeb = useIsDesktopWeb();
  const { openThread, createNewChat } = useAppNavigation();
  const [query, setQuery] = useState("");
  const {
    bookmarked,
    groups,
    hasChats,
    isLoading,
    isError,
    retry,
    renameChat,
    toggleBookmark,
  } = useMemoryChats(query);

  const rowHandlers = {
    onOpen: (chat: ChatSummary) => openThread(chat.id),
    onRename: renameChat,
    onToggleBookmark: toggleBookmark,
  };

  return (
    <div className="font-funnel relative flex h-full w-full flex-1 flex-col overflow-hidden bg-transparent">
      <PageLoaderSwitch loading={isLoading}>
        <div
          className={cn(
            "scrollbar-none absolute inset-0 overflow-y-auto",
            !isDesktopWeb && "px-5 pt-5 pb-4",
          )}
        >
          <div
            className={
              isDesktopWeb
                ? "mx-auto w-full max-w-[calc(844px*var(--wx,1)_+_6px)] space-y-12 px-10 pt-[52px] pb-20"
                : "space-y-12"
            }
          >
            <SectionBanner
              {...MEMORY_BANNERS.memory}
              height={MEMORY_BANNER_HEIGHT}
              imageScrim
            />

            <BookmarkedChats
              chats={bookmarked}
              isError={isError}
              {...rowHandlers}
            />

            <SectionBanner
              {...MEMORY_BANNERS.history}
              height={MEMORY_BANNER_HEIGHT}
              imageScrim
            />

            {/* Open and clean: no fill, no pill, just an underline. */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <Search
                size={14}
                className="shrink-0 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={MEMORY_COPY.searchPlaceholder}
                aria-label="Search your chats"
                className="flex-1 border-none bg-transparent text-xs text-[#0A1F4D] placeholder-[#0A1F4D]/50 focus:outline-none dark:placeholder-white/40"
              />
            </div>

            <ChatHistorySection
              groups={groups}
              isError={isError}
              hasChats={hasChats}
              onRetry={retry}
              onStartChat={() => createNewChat()}
              {...rowHandlers}
            />

            {!isDesktopWeb && <ScreenFooter tagline={MEMORY_FOOTER_TAGLINE} />}
          </div>
          {isDesktopWeb && (
            <ScreenFooter
              wide
              tagline={MEMORY_FOOTER_TAGLINE}
            />
          )}
        </div>
      </PageLoaderSwitch>
    </div>
  );
}
