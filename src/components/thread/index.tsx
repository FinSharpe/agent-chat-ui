"use client";

import { useFileUpload } from "@/hooks/use-file-upload";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { PageLoaderSwitch } from "@/components/shared/PageLoader";
import { streamErrorToast } from "@/lib/stream-error";
import { cn } from "@/lib/utils";
import {
  ChatComposer,
  ChatEmptyState,
  ChatToolbar,
  useChatModelSync,
  useChatSubmit,
  usePendingPromptHandoff,
} from "@/modules/chat";
// By file path, not "@/modules/credits": the barrel carries the Credits page.
import { useRefreshCreditsOnCarrier } from "@/modules/credits/hooks/useCredits";
import { useChatConnection, useStreamContext } from "@/providers/Stream";
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
const PILL_BOTTOM =
  "calc(104px + max(0px, env(safe-area-inset-bottom) - 10px))";

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
    <div className="rounded-card pointer-events-none absolute inset-3 z-[60] flex items-center justify-center border-2 border-dashed border-[#063BAA]/30 bg-[#063BAA]/6 backdrop-blur-[1px]">
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
  const { submitMessage, regenerate, retryLastTurn } = useChatSubmit();
  useChatModelSync();

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

  // A turn's Charge (or a refusal) lands as a `credits` carrier on its
  // answer; the Balance on the account surfaces is read again when it does.
  useRefreshCreditsOnCarrier(messages);

  // The thread itself carries the failure and the Retry; this toast only makes
  // sure it is noticed when the user has scrolled away from it. Deliberately
  // no status code, no error text and no deployment URL — the raw error is
  // logged for developers in StreamSession's onError. A guardrail outage or
  // the credits pause says so, in the same words as the thread (#282).
  const lastError = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    const signature =
      (stream.error as { message?: string } | null)?.message ??
      String(stream.error);
    if (lastError.current === signature) return;
    lastError.current = signature;
    const { title, description } = streamErrorToast(stream.error);
    toast.error(title, {
      description,
      richColors: true,
      closeButton: true,
    });
  }, [stream.error]);

  // Nothing to resend means the conversation itself never loaded; a reload is
  // the only way back from there.
  const retry = useCallback(() => {
    if (!retryLastTurn()) window.location.reload();
  }, [retryLastTurn]);

  // A saved chat that renders nothing. `useStream` surfaces no error when the
  // history fetch itself fails, so an unreachable server looks exactly like a
  // chat with no messages — ask the server which it is before letting the
  // blank thread stand.
  const { reachable, recheck, threadLoading } = useChatConnection();
  const looksBlank =
    !!threadId &&
    !threadLoading &&
    messages.length === 0 &&
    !isLoading &&
    !stream.error;
  useEffect(() => {
    if (looksBlank) void recheck();
  }, [looksBlank, recheck]);

  // The box empties only when the message goes out: a send waiting for a
  // model choice leaves it as typed, and a cancelled choice loses nothing.
  const sendTyped = () => {
    if (isLoading) return;
    submitMessage(input, contentBlocks, {
      onSent: () => {
        setInput("");
        setContentBlocks([]);
      },
    });
  };

  const sendPrompt = (prompt: string) => {
    if (isLoading) return;
    submitMessage(prompt);
  };

  // A handed-over prompt has already left the store; if the user closes the
  // model choice instead of choosing, it lands in the composer, not nowhere.
  const sendHandedOffPrompt = useCallback(
    (prompt: string) =>
      submitMessage(prompt, [], {
        fresh: true,
        onCancel: () => setInput(prompt),
      }),
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

  // Repopulating a saved chat is a full-page wait for the transcript: the
  // page loader fills it (until then `useStream` still holds the previous
  // chat), while the toolbar and composer stay drawn — as mobile (#153).
  const conversation = (
    <PageLoaderSwitch loading={threadLoading}>
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
                onRetry={retry}
                loadFailed={looksBlank && !reachable}
              />
            )}
          </div>
        </ScrollArea>
        {!isEmpty && <ScrollToBottom desktop={desktop} />}
      </StickToBottom>
    </PageLoaderSwitch>
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
