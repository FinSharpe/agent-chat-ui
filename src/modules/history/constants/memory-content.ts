import { BANNER_WAVE } from "@/components/shared/SectionKit";

/** Copy and artwork of the Memory page, as the desktop-web reference has it. */
export const MEMORY_BANNERS = {
  memory: {
    eyebrow: "Long-term Chat Memory",
    title:
      "Remembers every chat, portfolio and report so you can pick up anytime.",
    tone: "mint",
    image: BANNER_WAVE.cyan,
  },
  history: {
    eyebrow: "Full History",
    title: "Every past conversation, one search away.",
    tone: "blue",
    image: "/graphics/memory-history.jpg",
  },
} as const;

/** Both banners are the reference's shorter 260px separator cards. */
export const MEMORY_BANNER_HEIGHT = 260;

export const MEMORY_FOOTER_TAGLINE = "Anchor every conversation that matters.";

export const MEMORY_COPY = {
  bookmarkedHeading: "Bookmarked Chats",
  historyHeading: "Chat History",
  searchPlaceholder: "Search your chats…",
  noMatches: "No chats found.",
  noBookmarks: "Bookmark a chat to keep it here.",
  noChats: "No conversations yet.",
  startChat: "Start a chat",
  loadFailed: "Couldn't load your chats.",
  retry: "Try again",
} as const;
