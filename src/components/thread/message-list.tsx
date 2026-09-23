"use client";

import { Checkpoint } from "@langchain/langgraph-sdk";
import { useMemo } from "react";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import {
  connectCardMessages,
  getPortfolioConnect,
} from "@/lib/portfolio-connect";
import { DynamicSuggestions } from "@/modules/chat";
import { useStreamContext } from "@/providers/Stream";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import McpAppToolMessage from "./messages/client-components/mcp-app";
import { HumanMessage } from "./messages/human";
import { PortfolioConnectCard } from "./messages/portfolio-connect";
import {
  StreamErrorState,
  type StreamErrorVariant,
} from "./messages/stream-error";
import { getContentString } from "./utils";

/**
 * The conversation: turns in order, the loader while a run is going, the
 * agent's suggested next steps under the latest answer, and a run error.
 */
export function MessageList({
  onSuggestion,
  onRegenerate,
  onRetry,
  loadFailed = false,
}: {
  onSuggestion: (prompt: string) => void;
  onRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
  /** Resends the last user turn after a failed or dropped run. */
  onRetry: () => void;
  /** The conversation is empty because it could not be fetched, not because
   *  it has no turns — the server did not answer. */
  loadFailed?: boolean;
}) {
  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const nextPromptSuggestions = stream.values.next_prompt_suggestions ?? [];
  // Tool results that answer a missing portfolio with a connect card — one
  // card per distinct invitation per turn.
  const connectCards = useMemo(() => connectCardMessages(messages), [messages]);

  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const last = messages[messages.length - 1];
  // Which failure the user is looking at: nothing came back at all, an answer
  // was cut off part-way, or the conversation never loaded.
  const errorVariant: StreamErrorVariant = !last
    ? "load"
    : last.type === "human"
      ? "send"
      : "interrupted";
  // Values stream whole steps: once the final answer is on screen the run is
  // only wrapping up (suggestions, the grounding check), so the loader drops
  // its skeleton rather than promise more text.
  const answerOnScreen =
    last?.type === "ai" &&
    getContentString(last.content).length > 0 &&
    !("tool_calls" in last && last.tool_calls?.length);

  return (
    <div className="chat-thread space-y-4">
      {messages
        .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
        .map((message, index) =>
          message.type === "human" ? (
            <HumanMessage
              key={message.id || `${message.type}-${index}`}
              message={message}
              isLoading={isLoading}
            />
          ) : message.type === "tool" && connectCards.has(message) ? (
            // A portfolio tool with nothing to read answers with a card that
            // connects the missing accounts (#79), whatever hide-tool-calls
            // says: it is the turn's way forward, not tool detail.
            <PortfolioConnectCard
              key={message.id || `${message.type}-${index}`}
              connect={getPortfolioConnect(message)!}
            />
          ) : message.type === "tool" ? (
            // Render-tool results render as an inline MCP-Apps widget
            // (no accordion, independent of hide-tool-calls); returns
            // null for ordinary tool results, which show via the
            // calling AIMessage's tool-call accordion instead.
            <McpAppToolMessage
              key={message.id || `${message.type}-${index}`}
              message={message}
            />
          ) : (
            <AssistantMessage
              key={message.id || `${message.type}-${index}`}
              message={message}
              isLoading={isLoading}
              handleRegenerate={onRegenerate}
            />
          ),
        )}
      {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
          We need to render it outside of the messages list, since there are no messages to render */}
      {hasNoAIOrToolMessages && !!stream.interrupt && (
        <AssistantMessage
          key="interrupt-msg"
          message={undefined}
          isLoading={isLoading}
          handleRegenerate={onRegenerate}
        />
      )}
      {isLoading && (
        <AssistantMessageLoading
          phase={answerOnScreen ? "finishing" : "thinking"}
        />
      )}
      {/* Deliberately NOT gated on !isLoading. The suggestions land
          in a state update from the agent's after_agent hook, which
          resolves well before the run closes — the run also carries
          the grounding judge, which has nothing to do with these
          chips. Gating on run completion made the user wait out the
          judge to see them. They stay disabled until the run ends
          (the submit path refuses while isLoading anyway), so this
          only brings the render forward, and the submit path clears
          next_prompt_suggestions optimistically, so what is on
          screen is never the previous turn's. */}
      {nextPromptSuggestions.length > 0 &&
        messages.length > 0 &&
        last.type === "ai" && (
          <DynamicSuggestions
            suggestions={nextPromptSuggestions}
            onSelect={onSuggestion}
            disabled={isLoading}
          />
        )}
      {((!!stream.error && !isLoading) || loadFailed) && (
        <StreamErrorState
          variant={errorVariant}
          onRetry={onRetry}
        />
      )}
    </div>
  );
}
