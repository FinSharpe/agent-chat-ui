import { CitationProvider } from "@/hooks/use-citation";
import { useHideToolCalls } from "@/hooks/useDefaultApiValues";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { isScannerApprovalInterrupt } from "@/lib/scanner-approval-interrupt";
import { cn } from "@/lib/utils";
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
import { CitationsList } from "../citations-list";
import { MarkdownText } from "../markdown-text";
import { getContentString } from "../utils";
import ClientComponentsRegistry from "./client-components/registry";
import { getMcpAppPayload } from "./client-components/mcp-app";
import { GenericInterruptView } from "./generic-interrupt";
import { ScannerApprovalInterruptView } from "./scanner-approval-interrupt";
import { BranchSwitcher, CommandBar } from "./shared";
import { ToolCalls } from "./tool-calls";
import { ThinkingLoader } from "./thinking-loader";

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

function parseAnthropicStreamedToolCalls(
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
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
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
  const allToolCallsAreWidgets =
    !!hasToolCalls &&
    (message as AIMessage).tool_calls!.every((tc) => {
      const resp = tc.id ? toolMessagesById.get(tc.id) : undefined;
      return resp ? !!getMcpAppPayload(resp) : false;
    });

  if (isToolResult) {
    return null;
  }

  // Hide the tool-calling bubble when its only output is widget(s) and it has no
  // text of its own — the widget (rendered from the tool message) is the result.
  if (allToolCallsAreWidgets && !contentString) {
    return null;
  }

  if (hideToolCalls && hasToolCalls) {
    return (
      <CitationProvider>
        <>
          <Interrupt
            interruptValue={threadInterrupt?.value}
            isLastMessage={isLastMessage}
            hasNoAIOrToolMessages={hasNoAIOrToolMessages}
          />
          {message && (
            <CustomComponent
              message={message}
              thread={thread}
            />
          )}
        </>
      </CitationProvider>
    );
  }

  if (hasToolCalls && !hideToolCalls) {
    return (
      <CitationProvider>
        <div className="chat-message-table group mr-auto flex w-full items-start">
          <div className="flex w-full flex-col">
            {contentString.length > 0 && (
              <div className="py-1">
                <MarkdownText>{contentString}</MarkdownText>
                <CitationsList content={contentString} />
              </div>
            )}

            {(hasToolCalls && toolCallsHaveContents && (
              <ToolCalls toolCalls={message.tool_calls} />
            )) ||
              (hasAnthropicToolCalls && (
                <ToolCalls toolCalls={anthropicStreamedToolCalls} />
              )) ||
              (hasToolCalls && (
                <ToolCalls toolCalls={message.tool_calls} />
              ))}

            <Interrupt
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}
            {/* No command bar on messages with tool calls — the copy/regenerate
                controls would leave dead whitespace between the tool group and
                the next turn. Plain-text turns keep their command bar below. */}
          </div>
        </div>
      </CitationProvider>
    );
  }

  return (
    <CitationProvider>
      <div className="chat-message-table group mr-auto flex w-full items-start">
        <div className="flex w-full flex-col">
          {contentString.length > 0 && (
            <div className="py-1">
              <MarkdownText>{contentString}</MarkdownText>
              <CitationsList content={contentString} />
            </div>
          )}

          {message && (
            <CustomComponent
              message={message}
              thread={thread}
            />
          )}
          <Interrupt
            interruptValue={threadInterrupt?.value}
            isLastMessage={isLastMessage}
            hasNoAIOrToolMessages={hasNoAIOrToolMessages}
          />
          {!hasToolCalls && !!contentString && (
            <div
              className={cn(
                "mr-auto flex items-center gap-2 transition-opacity",
                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
              )}
            >
              <BranchSwitcher
                branch={meta?.branch}
                branchOptions={meta?.branchOptions}
                onSelect={(branch) => thread.setBranch(branch)}
                isLoading={isLoading}
              />
              <CommandBar
                content={contentString}
                isLoading={isLoading}
                isAiMessage={true}
                handleRegenerate={() => handleRegenerate(parentCheckpoint)}
              />
            </div>
          )}
        </div>
      </div>
    </CitationProvider>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="mr-auto flex w-full items-start">
      <ThinkingLoader />
    </div>
  );
}
