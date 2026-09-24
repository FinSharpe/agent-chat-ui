import { useHideToolCalls } from "@/hooks/useDefaultApiValues";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { stripCitationMarkers } from "@/lib/citations";
import { isScannerApprovalInterrupt } from "@/lib/scanner-approval-interrupt";
import { PipelineSummaryCardView, readSummaryCard } from "@/modules/pipelines";
import { useStreamContext } from "@/providers/Stream";
import { MessageContentComplex } from "@langchain/core/messages";
import { parsePartialJson } from "@langchain/core/output_parsers";
import {
  AIMessage,
  Checkpoint,
  Message,
  ToolMessage,
} from "@langchain/langgraph-sdk";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { Fragment, useMemo } from "react";
import { ThreadView } from "../agent-inbox";
import { useArtifact } from "../artifact";
import {
  CitationProvider,
  CitationSourcesFooter,
  useTurnCitations,
} from "../citations";
import { MarkdownText } from "../markdown-text";
import { getContentString } from "../utils";
import ClientComponentsRegistry from "./client-components/registry";
import { getMcpAppPayload } from "./client-components/mcp-app";
import { GenericInterruptView } from "./generic-interrupt";
import { ScannerApprovalInterruptView } from "./scanner-approval-interrupt";
import { BranchSwitcher, CommandBar } from "./shared";
import { HearOutputCard } from "@/modules/chat";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();

  // Filter for components belonging to this message
  // And dedup by taking the last one for each component ID (or just the very last one if they share ID)
  // Since our backend emits updates with same msg_id, we want to grab the latest state.
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  // If we have multiple updates for the SAME component ID, we only want the last one.
  // Group by ui.id (component id) and take the last.
  const latestComponents = useMemo(() => {
    if (!customComponents) return [];
    const map = new Map();
    for (const c of customComponents) {
      map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [customComponents]);

  if (!latestComponents?.length) return null;

  return (
    <Fragment key={message.id}>
      {latestComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread as any}
          message={customComponent}
          meta={{ ui: customComponent, artifact }}
          components={ClientComponentsRegistry}
        />
      ))}
    </Fragment>
  );
}

/** Tool calls an Anthropic model is still streaming, read from its content
 *  blocks before `tool_calls` is filled in. */
export function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch (e) {
        console.warn("Failed to parse partial JSON:", toolCall.id, e);
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

interface InterruptProps {
  interruptValue?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interruptValue,
  isLastMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  return (
    <>
      {isAgentInboxInterruptSchema(interruptValue) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
          <ThreadView interrupt={interruptValue} />
        )}
      {isScannerApprovalInterrupt(interruptValue) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
          <ScannerApprovalInterruptView interrupt={interruptValue} />
        )}
      {interruptValue &&
      !isAgentInboxInterruptSchema(interruptValue) &&
      !isScannerApprovalInterrupt(interruptValue) &&
      (isLastMessage || hasNoAIOrToolMessages) ? (
        <GenericInterruptView interrupt={interruptValue} />
      ) : null}
    </>
  );
}

/**
 * The answer card: the reference's white bubble, squared at the top-left.
 * Its copy / regenerate / version actions float on the top edge on hover
 * (desktop) or sit under the text on touch screens — see `.chat-msg-actions`
 * in chat.css — so they never reserve empty space between turns.
 */
function AnswerCard({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="chat-msg glass-card rounded-nested relative max-w-[92%] min-w-0 rounded-tl-xs p-4.5 text-[13px] text-[#0A1F4D]">
      {children}
      {actions && (
        <div className="chat-msg-actions chat-msg-actions--end">{actions}</div>
      )}
    </div>
  );
}

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);
  const [hideToolCalls] = useHideToolCalls();

  const thread = useStreamContext();

  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const isToolResult = message?.type === "tool";

  // Tool results in this thread, by call id — used to detect tool calls whose
  // output renders as an inline MCP-Apps widget (shown via McpAppToolMessage).
  const toolMessagesById = useMemo(() => {
    const map = new Map<string, ToolMessage>();
    for (const m of thread.messages) {
      if (m.type === "tool" && m.tool_call_id) map.set(m.tool_call_id, m);
    }
    return map;
  }, [thread.messages]);
  // The turn's filings citations: the registry every tool message in this turn
  // carried, this answer's markers resolved against it, and whether the sources
  // footer belongs under this message.
  const citations = useTurnCitations(message, contentString);
  const answer = citations.index.text;
  // A turn is settled once its run has ended — or a later question exists,
  // which can only happen after it did.
  const turnSettled = useMemo(() => {
    if (!isLoading) return true;
    const position = thread.messages.findIndex((m) => m.id === message?.id);
    return (
      position !== -1 &&
      thread.messages.slice(position + 1).some((m) => m.type === "human")
    );
  }, [isLoading, thread.messages, message?.id]);
  // The floor, not a fallback: the footer renders whenever the turn retrieved
  // filings, cited or not. Held back until the run finishes so it does not
  // judder down the screen on every token.
  const showSourcesFooter =
    !citations.registry.isEmpty &&
    citations.isLastAnswerOfTurn &&
    !isLoading &&
    !!answer;
  // Read-aloud belongs to the turn's final answer, once it is complete.
  const showHearOutput =
    citations.isLastAnswerOfTurn && turnSettled && !!answer;

  const allToolCallsAreWidgets =
    !!hasToolCalls &&
    (message as AIMessage).tool_calls!.every((tc) => {
      const resp = tc.id ? toolMessagesById.get(tc.id) : undefined;
      return resp ? !!getMcpAppPayload(resp) : false;
    });

  if (isToolResult) {
    return null;
  }

  // A published research report delivers a Summary Card into the thread. Its
  // text content is the fallback for a renderer that does not know the card;
  // this one does, so it shows the card instead of restating it as prose.
  const summaryCard = readSummaryCard(message);
  if (summaryCard) {
    return (
      <div className="animate-fade-in flex w-full items-start">
        <PipelineSummaryCardView card={summaryCard} />
      </div>
    );
  }

  // Hide the tool-calling bubble when its only output is widget(s) and it has no
  // text of its own — the widget (rendered from the tool message) is the result.
  if (allToolCallsAreWidgets && !contentString) {
    return null;
  }

  const interrupt = (
    <Interrupt
      interruptValue={threadInterrupt?.value}
      isLastMessage={isLastMessage}
      hasNoAIOrToolMessages={hasNoAIOrToolMessages}
    />
  );
  const customComponents = message && (
    <CustomComponent
      message={message}
      thread={thread}
    />
  );

  if (hideToolCalls && hasToolCalls) {
    return (
      <CitationProvider>
        <>
          {interrupt}
          {customComponents}
        </>
      </CitationProvider>
    );
  }

  const actions = !hasToolCalls && !!answer && (
    <>
      <BranchSwitcher
        branch={meta?.branch}
        branchOptions={meta?.branchOptions}
        onSelect={(branch) => thread.setBranch(branch)}
        isLoading={isLoading}
      />
      <CommandBar
        // Copying an answer must not carry its citation machinery.
        content={stripCitationMarkers(answer)}
        isLoading={isLoading}
        isAiMessage={true}
        handleRegenerate={() => handleRegenerate(parentCheckpoint)}
      />
    </>
  );

  const answerCard = answer.length > 0 && (
    <AnswerCard actions={actions}>
      <MarkdownText
        variant="chat"
        citations={citations.index}
      >
        {answer}
      </MarkdownText>
      {showSourcesFooter && (
        <CitationSourcesFooter registry={citations.registry} />
      )}
    </AnswerCard>
  );

  if (hasToolCalls && !hideToolCalls) {
    return (
      <CitationProvider>
        <div className="animate-fade-in flex w-full flex-col gap-3 empty:hidden">
          {answerCard}
          {/* The calls themselves are drawn by the turn (MessageList), which
              groups consecutive tool rounds into one ToolCallGroup. */}
          {interrupt}
          {customComponents}
          {/* No actions on messages with tool calls: the copy/regenerate
              controls belong to the turn's final answer. */}
        </div>
      </CitationProvider>
    );
  }

  return (
    <CitationProvider>
      <div className="animate-fade-in flex w-full flex-col gap-3 empty:hidden">
        {answerCard}
        {customComponents}
        {interrupt}
        {showHearOutput && (
          <HearOutputCard text={stripCitationMarkers(answer)} />
        )}
      </div>
    </CitationProvider>
  );
}
