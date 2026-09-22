import { MEMORY_COPY } from "../constants/memory-content";
import type { ChatSummary } from "../hooks/useChatHistory";
import type { ChatGroup } from "../hooks/useMemoryChats";
import ChatRow from "./ChatRow";
import ChatRowsSkeleton from "./ChatRowsSkeleton";

interface ChatHistorySectionProps {
  groups: ChatGroup[];
  isLoading: boolean;
  isError: boolean;
  /** False when the user has no chats at all, as opposed to none matching. */
  hasChats: boolean;
  onRetry: () => void;
  onStartChat: () => void;
  onOpen: (chat: ChatSummary) => void;
  onRename: (chat: ChatSummary, value: string) => void;
  onToggleBookmark: (chat: ChatSummary) => void;
}

function Notice({
  message,
  action,
  onAction,
}: {
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <p className="py-4 text-center text-xs text-slate-400">
      {message}
      {action && (
        <>
          {" "}
          <button
            type="button"
            onClick={onAction}
            className="cursor-pointer font-medium text-[#063BAA] hover:underline"
          >
            {action}
          </button>
        </>
      )}
    </p>
  );
}

/** The full, searchable history — cardless hairline rows under date labels. */
export default function ChatHistorySection({
  groups,
  isLoading,
  isError,
  hasChats,
  onRetry,
  onStartChat,
  ...rowHandlers
}: ChatHistorySectionProps) {
  const body = () => {
    if (isLoading) {
      return (
        <div className="space-y-1">
          <div className="h-3 w-16 animate-pulse rounded-md bg-slate-100" />
          <ChatRowsSkeleton
            variant="history"
            rows={4}
          />
        </div>
      );
    }
    if (isError) {
      return (
        <Notice
          message={MEMORY_COPY.loadFailed}
          action={MEMORY_COPY.retry}
          onAction={onRetry}
        />
      );
    }
    if (!hasChats) {
      return (
        <Notice
          message={MEMORY_COPY.noChats}
          action={MEMORY_COPY.startChat}
          onAction={onStartChat}
        />
      );
    }
    if (groups.length === 0) return <Notice message={MEMORY_COPY.noMatches} />;

    return groups.map((g) => (
      <div
        key={g.group}
        className="space-y-1"
      >
        <p className="px-1 text-[10px] font-medium text-[#0A1F4D]/50 dark:text-white/50">
          {g.group}
        </p>
        <div>
          {g.chats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              variant="history"
              {...rowHandlers}
            />
          ))}
        </div>
      </div>
    ));
  };

  return (
    <section className="space-y-2">
      <h3 className="block pl-1 text-xs font-medium tracking-wider text-black uppercase dark:text-white">
        {MEMORY_COPY.historyHeading}
      </h3>
      {body()}
    </section>
  );
}
