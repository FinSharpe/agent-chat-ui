"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  BRIEFLY_UNAVAILABLE_BODY,
  BRIEFLY_UNAVAILABLE_HEADING,
  type StreamErrorVariant,
} from "@/lib/stream-error";

export type { StreamErrorVariant } from "@/lib/stream-error";

/**
 * What the thread shows when a run fails (T-10 item 5).
 *
 * It sits where the answer would have been and is written for an investor,
 * not an operator: no deployment URL, no API key, no stack. The technical
 * detail stays on `console.error` (see `StreamSession.onError`).
 *
 * Treatment follows `@/components/shared/SectionErrorState` — amber mark,
 * heading, one supporting line, one retry — shaped like an assistant bubble so
 * it reads as the turn that did not arrive.
 *
 * The variant is chosen by `streamErrorVariant` (`@/lib/stream-error`): from
 * the error's class name when the agents named an outage or the credits pause
 * ("unavailable", finsharpe-agents#282), otherwise from where the thread
 * stopped. The server's message is never shown.
 */
const COPY: Record<StreamErrorVariant, { heading: string; body: string }> = {
  unavailable: {
    heading: BRIEFLY_UNAVAILABLE_HEADING,
    body: BRIEFLY_UNAVAILABLE_BODY,
  },
  send: {
    heading: "Your message didn't get through",
    body: "We couldn't reach FinSharpe GPT just now. Nothing was lost — send it again in a moment.",
  },
  interrupted: {
    heading: "This answer stopped early",
    body: "The connection dropped before FinSharpe GPT finished. Retry to ask the same question again.",
  },
  load: {
    heading: "We couldn't load this chat",
    body: "The connection to FinSharpe GPT dropped. Your chats are safe — try again in a moment.",
  },
};

export function StreamErrorState({
  variant,
  onRetry,
}: {
  variant: StreamErrorVariant;
  onRetry: () => void;
}) {
  const { heading, body } = COPY[variant];

  return (
    <div
      role="alert"
      data-stream-error={variant}
      className="font-funnel animate-fade-in flex w-full items-start"
    >
      <div className="rounded-nested max-w-[92%] min-w-0 rounded-tl-xs border border-amber-100 bg-amber-50/80 p-4.5 dark:border-amber-500/20 dark:bg-amber-500/10">
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            size={15}
            className="mt-px shrink-0 text-amber-500"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-geist text-[12.5px] font-medium text-[#0A1F4D] dark:text-white">
              {heading}
            </p>
            <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              {body}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 ml-[25px] flex items-center gap-1.5 rounded-full border border-amber-200 px-3.5 py-1.5 text-[11px] font-medium text-[#0A1F4D] transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-500/15"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    </div>
  );
}

export default StreamErrorState;
