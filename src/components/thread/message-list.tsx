"use client";

import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { Fragment, useMemo } from "react";
import { useHideToolCalls } from "@/hooks/useDefaultApiValues";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import {
  connectCardMessages,
  getPortfolioConnect,
} from "@/lib/portfolio-connect";
import {
  currentStep,
  projectTurn,
  splitTurns,
  stepDone,
  type TurnPart,
} from "@/lib/tool-activity";
import { readSummaryCard } from "@/modules/pipelines";
import { DynamicSuggestions } from "@/modules/chat";
import { useStreamContext } from "@/providers/Stream";
import {
  AssistantMessage,
  parseAnthropicStreamedToolCalls,
} from "./messages/ai";
import McpAppToolMessage, {
  getMcpAppPayload,
} from "./messages/client-components/mcp-app";
import { HumanMessage } from "./messages/human";
import {
  RunLine,
  ToolCallGroup,
  type RunPhase,
} from "./messages/tool-call-group";
import { PortfolioConnectCard } from "./messages/portfolio-connect";
import {
  StreamErrorState,
  type StreamErrorVariant,
} from "./messages/stream-error";
import { getContentString } from "./utils";

/** The calls an AI message makes — including the ones an Anthropic model is
 *  still streaming as content blocks. */
function toolCallsOf(message: AIMessage): AIMessage["tool_calls"] {
  if (message.tool_calls?.length) return message.tool_calls;
  return Array.isArray(message.content)
    ? parseAnthropicStreamedToolCalls(message.content as never)
    : undefined;
}

const isAnswerVisible = (message: Message) =>
  getContentString(message.content).trim().length > 0 ||
  readSummaryCard(message) !== null;

/**
 * The conversation: turns in order, each turn's tool activity and run line
 * (after finsharpe-mobile's chat transcript), the agent's suggested next
 * steps under the latest answer, and a run error.
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
  const [hideToolCalls] = useHideToolCalls();
  const turns = useMemo(
    () =>
      splitTurns(messages).map(({ human, turn }) => ({
        human,
        turn,
        parts: projectTurn(turn, {
          isMessageVisible: isAnswerVisible,
          isToolBoundary: (m) => !!getMcpAppPayload(m) || connectCards.has(m),
          toolCallsOf,
        }),
      })),
    [messages, connectCards],
  );
  // Grounding checks still waiting on their verdict (band not yet set).
  const uiItems = stream.values.ui;
  const checkingIds = useMemo(
    () =>
      new Set(
        (uiItems ?? [])
          .filter(
            (ui) =>
              ui.name === "data_grounding" &&
              (ui.props as { band?: unknown } | undefined)?.band == null,
          )
          .map((ui) => ui.metadata?.message_id as string | undefined),
      ),
    [uiItems],
  );

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
  const renderPart = (part: TurnPart) => {
    if (part.kind === "tools") return null;
    const message = part.message;
    if (message.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)) return null;
    if (message.type === "tool") {
      // A portfolio tool with nothing to read answers with a card that
      // connects the missing accounts (#79), whatever hide-tool-calls says:
      // it is the turn's way forward, not tool detail. Otherwise the result
      // is a report, drawn as an inline MCP-Apps widget.
      return connectCards.has(message) ? (
        <PortfolioConnectCard
          key={part.key}
          connect={getPortfolioConnect(message)!}
        />
      ) : (
        <McpAppToolMessage
          key={part.key}
          message={message}
        />
      );
    }
    return (
      <AssistantMessage
        key={part.key}
        message={message}
        isLoading={isLoading}
        handleRegenerate={onRegenerate}
      />
    );
  };

  return (
    <div className="chat-thread space-y-4">
      {turns.map(({ human, turn, parts }, turnIndex) => {
        const live = isLoading && turnIndex === turns.length - 1;
        const steps = parts.flatMap((p) => (p.kind === "tools" ? p.steps : []));
        const running = steps.some((step) => !stepDone(step));
        const failed =
          !live && !!stream.error && turnIndex === turns.length - 1;
        const phase: RunPhase = live
          ? running
            ? "running"
            : "preparing"
          : failed
            ? "failed"
            : "settled";
        const activeCallKey = live ? currentStep(steps)?.key : undefined;
        // The run line closes a live turn only when no tool row is carrying
        // the active state — never a second loader beside it (#132).
        let runLine: RunPhase | null = null;
        if (live && (!running || hideToolCalls)) {
          runLine = running
            ? "running"
            : turn.some((m) => m.id && checkingIds.has(m.id))
              ? "checking"
              : steps.length > 0 || turn.some(isAnswerVisible)
                ? "preparing"
                : "thinking";
        }
        return (
          <Fragment key={human?.id ?? `turn-${turnIndex}`}>
            {human && (
              <HumanMessage
                message={human}
                isLoading={isLoading}
              />
            )}
            {parts.map((part) =>
              part.kind === "tools"
                ? !hideToolCalls && (
                    <ToolCallGroup
                      key={part.key}
                      steps={part.steps}
                      phase={phase}
                      activeCallKey={activeCallKey}
                    />
                  )
                : renderPart(part),
            )}
            {runLine && <RunLine phase={runLine} />}
          </Fragment>
        );
      })}
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
