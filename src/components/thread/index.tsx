"use client";

import { useFileUpload } from "@/hooks/use-file-upload";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { cn } from "@/lib/utils";
import {
  ChatComposer,
  ChatEmptyState,
  ChatToolbar,
  useChatSubmit,
  usePendingPromptHandoff,
} from "@/modules/chat";
import { useStreamContext } from "@/providers/Stream";
import { ArrowDown, Paperclip } from "lucide-react";
import { useQueryState } from "nuqs";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ArtifactPanel } from "./artifact-panel";
import { MessageList } from "./message-list";

// The phone composer floats this far above the bottom of the page — clear of
// the bottom nav, as in the reference — plus any home-indicator inset the nav
// grows by.
const PILL_BOTTOM = "calc(104px + max(0px, env(safe-area-inset-bottom) - 10px))";

function ScrollArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { scrollRef, contentRef } = useStickToBottomContext();
  return (
    <div
      ref={scrollRef}
      className="scrollbar-none absolute inset-0 overflow-y-auto"
    >
      <div
        ref={contentRef}
        className={className}
      >
        {children}
      </div>
    </div>
  );
}

function ScrollToBottom({ desktop }: { desktop: boolean }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  if (isAtBottom) return null;
  return (
    <button
      type="button"
      onClick={() => scrollToBottom()}
      className="glass-nav animate-in fade-in-0 zoom-in-95 absolute left-1/2 z-30 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 text-[11px] font-medium text-[#0A1F4D]"
      style={{ bottom: desktop ? 12 : `calc(${PILL_BOTTOM} + 76px)` }}
    >
      <ArrowDown size={13} />
      Scroll to bottom
    </button>
  );
}

function DropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-3 z-[60] flex items-center justify-center rounded-card border-2 border-dashed border-[#063BAA]/30 bg-[#063BAA]/6 backdrop-blur-[1px]">
      <div className="glass-nav flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-medium text-[#0A1F4D]">
        <Paperclip
          size={14}
          className="text-[#063BAA]"
        />
        Drop files to attach
      </div>
    </div>
  );
}

/**
 * The Chat page, laid out like the reference ChatScreen. Desktop: a centred
 * reading column with the composer card fixed under it (centred with the
 * starter prompts on a new chat). Phone: the slim chat toolbar, the
 * conversation, and the composer pill floating over the bottom nav.
 */
export function Thread() {
  const desktop = useIsDesktopWeb();
  const [threadId] = useQueryState("threadId");
  const stream = useStreamContext();
  const { submitMessage, regenerate } = useChatSubmit();

  const [input, setInput] = useState("");
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    dragOver,
    handlePaste,
  } = useFileUpload();

  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const isEmpty = !threadId && messages.length === 0;

  // A failed run also toasts once, so it is seen even when scrolled away.
  const lastError = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) return;
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  const sendTyped = () => {
    if (isLoading) return;
    if (submitMessage(input, contentBlocks)) {
      setInput("");
      setContentBlocks([]);
    }
  };

  const sendPrompt = (prompt: string) => {
    if (isLoading) return;
    submitMessage(prompt);
  };

  const sendHandedOffPrompt = useCallback(
    (prompt: string) => submitMessage(prompt, [], { fresh: true }),
    [submitMessage],
  );
  usePendingPromptHandoff({
    threadId,
    isLoading,
    send: sendHandedOffPrompt,
  });

  const composer = (variant: "card" | "pill") => (
    <ChatComposer
      variant={variant}
      isEmpty={isEmpty}
      isLoading={isLoading}
      input={input}
      onInputChange={setInput}
      blocks={contentBlocks}
      onRemoveBlock={removeBlock}
      onFileInput={handleFileUpload}
      onPaste={handlePaste}
      onSubmit={sendTyped}
      onStop={() => stream.stop()}
    />
  );

  const conversation = (
    <StickToBottom
      className="relative flex-1 overflow-hidden"
      initial="instant"
      resize="smooth"
    >
      <ScrollArea
        className={cn("px-5", desktop ? "pt-[52px] pb-8" : "py-5 pb-44")}
      >
        <div
          className={cn(
            desktop && "mx-auto w-full max-w-[calc(764px*var(--wx,1))]",
          )}
        >
          {isEmpty ? (
            <ChatEmptyState
              desktop={false}
              onPrompt={sendPrompt}
              disabled={isLoading}
            />
          ) : (
            <MessageList
              onSuggestion={sendPrompt}
              onRegenerate={regenerate}
            />
          )}
        </div>
      </ScrollArea>
      {!isEmpty && <ScrollToBottom desktop={desktop} />}
    </StickToBottom>
  );

  return (
    <div
      ref={dropRef}
      className="font-funnel relative flex h-full w-full flex-1 overflow-hidden bg-transparent"
    >
      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {!desktop && <ChatToolbar />}

        {desktop && isEmpty ? (
          <ChatEmptyState
            desktop
            composer={composer("card")}
            onPrompt={sendPrompt}
            disabled={isLoading}
          />
        ) : (
          conversation
        )}

        {desktop && !isEmpty && (
          <div className="bg-background shrink-0 px-5 pt-2 pb-6">
            <div className="mx-auto w-full max-w-[calc(764px*var(--wx,1))]">
              {composer("card")}
            </div>
          </div>
        )}

        {!desktop && (
          <div
            className="from-background via-background absolute right-0 left-0 z-35 bg-gradient-to-t to-transparent px-5 py-2"
            style={{ bottom: PILL_BOTTOM }}
          >
            {composer("pill")}
          </div>
        )}
      </div>

      <ArtifactPanel desktop={desktop} />
      {dragOver && <DropOverlay />}
    </div>
  );
}
