"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useId,
} from "react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { Mic, Paperclip, RefreshCw, Send } from "lucide-react";
import { ContentBlocksPreview } from "@/components/thread/ContentBlocksPreview";
import { cn } from "@/lib/utils";
import { useSpeechDictation } from "../hooks/useSpeechDictation";
import ModelPicker from "./ModelPicker";

const ACCEPTED_FILES =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,.csv,.xlsx";

export interface ChatComposerProps {
  /** `card`: the desktop composer. `pill`: the phone bar above the nav. */
  variant: "card" | "pill";
  /** A new chat: the card gets a taller box and the opening placeholder. */
  isEmpty: boolean;
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  blocks: Base64ContentBlock[];
  onRemoveBlock: (index: number) => void;
  onFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onStop: () => void;
}

/**
 * The message box, drawn as the reference composer: text on top, the model
 * pill and attach on the left, mic and send on the right (desktop card), or
 * one rounded bar (phone). Enter sends, Shift+Enter breaks the line; files
 * come in through the paperclip, paste, or a drop anywhere on the page.
 */
export default function ChatComposer({
  variant,
  isEmpty,
  isLoading,
  input,
  onInputChange,
  blocks,
  onRemoveBlock,
  onFileInput,
  onPaste,
  onSubmit,
  onStop,
}: ChatComposerProps) {
  const fileInputId = useId();
  const mic = useSpeechDictation({ value: input, onChange: onInputChange });
  const card = variant === "card";
  const canSend = input.trim().length > 0 || blocks.length > 0;

  const placeholder = mic.listening
    ? "Listening…"
    : isLoading
      ? "Wait for AI…"
      : !card
        ? "Type something…"
        : isEmpty
          ? "Ask anything about stocks, funds or your money…"
          : "Ask a follow-up…";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading || !canSend) return;
    if (mic.listening) mic.cancel();
    onSubmit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.metaKey &&
      !e.nativeEvent.isComposing
    ) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const size = card ? "h-9 w-9" : "h-8 w-8";
  const iconSize = card ? 16 : 15;

  const attach = (
    <>
      <label
        htmlFor={fileInputId}
        title="Attach file"
        className={cn(
          "flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#DFF9EF] text-[#0A1F4D] transition-all active:scale-95",
          size,
        )}
      >
        <Paperclip size={card ? 15 : 14} />
        <span className="sr-only">Attach file</span>
      </label>
      <input
        id={fileInputId}
        type="file"
        onChange={onFileInput}
        multiple
        accept={ACCEPTED_FILES}
        className="hidden"
      />
    </>
  );

  const micButton = mic.supported ? (
    <button
      type="button"
      onClick={mic.toggle}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-all",
        size,
        mic.listening
          ? "animate-pulse bg-rose-500 text-white"
          : "bg-[#DFF9EF] text-[#0A1F4D]",
      )}
      title={mic.listening ? "Stop dictation" : "Voice input"}
      aria-pressed={mic.listening}
    >
      <Mic size={iconSize} />
    </button>
  ) : null;

  const sendOrStop = isLoading ? (
    <button
      type="button"
      onClick={onStop}
      className={cn(
        "chat-stop-btn flex shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100",
        size,
      )}
      title="Stop"
    >
      <RefreshCw
        size={card ? 15 : 14}
        className="animate-spin"
      />
    </button>
  ) : (
    <button
      type="submit"
      disabled={!canSend}
      title="Send"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-all",
        size,
        canSend
          ? "bg-brand-gradient text-white shadow-xs"
          : "chat-send-idle bg-[#0A1F4D]/10 text-[#0A1F4D]/30",
      )}
    >
      <Send
        size={iconSize}
        strokeWidth={2.5}
      />
    </button>
  );

  const textarea = (
    <textarea
      autoFocus={card}
      rows={card && isEmpty ? 2 : 1}
      value={input}
      onChange={(e) => onInputChange(e.target.value)}
      onPaste={onPaste}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      aria-label="Message"
      className={cn(
        "field-sizing-content resize-none border-none bg-transparent text-[#0A1F4D] placeholder:text-[#0A1F4D]/50 focus:outline-none dark:placeholder:text-white/40",
        card
          ? "max-h-[240px] w-full text-[15px] leading-relaxed"
          : "max-h-[120px] min-w-0 flex-1 px-1 py-1.5 text-[15px] leading-5",
      )}
      style={
        card
          ? // field-sizing ignores `rows`; keep the reference's box height.
            { minHeight: `${(isEmpty ? 2 : 1) * 1.625}em` }
          : // The phone bar is narrow: an empty box keeps its placeholder on
            // one line instead of wrapping it into a two-line bar.
            input
            ? undefined
            : { whiteSpace: "nowrap", overflow: "hidden" }
      }
    />
  );

  if (card) {
    return (
      <form
        onSubmit={handleSubmit}
        className="glass-card premium-shadow-sm flex w-full flex-col gap-3.5 rounded-card p-5"
      >
        <ContentBlocksPreview
          blocks={blocks}
          onRemove={onRemoveBlock}
          className="p-0"
        />
        {textarea}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ModelPicker />
            {attach}
          </div>
          <div className="flex items-center gap-2">
            {micButton}
            {sendOrStop}
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <ContentBlocksPreview
        blocks={blocks}
        onRemove={onRemoveBlock}
        size="sm"
        className="p-0"
      />
      <form
        onSubmit={handleSubmit}
        className="glass-nav flex w-full items-end gap-1.5 rounded-[24px] p-2"
      >
        {micButton}
        <ModelPicker compact />
        {attach}
        {textarea}
        {sendOrStop}
      </form>
    </div>
  );
}
