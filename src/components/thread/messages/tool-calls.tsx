import { useStreamContext } from "@/providers/Stream";
import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useMemo, useState } from "react";
import { getMcpAppPayload } from "./client-components/mcp-app";
import { JsonViewer } from "./json-viewer";
import { ToolCallGroup } from "./tool-call-group";

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  const stream = useStreamContext();

  const toolResponses = useMemo(() => {
    const map = new Map<string, ToolMessage>();
    for (const m of stream.messages) {
      if (m.type === "tool" && m.tool_call_id) {
        map.set(m.tool_call_id, m);
      }
    }
    return map;
  }, [stream.messages]);

  if (!toolCalls || toolCalls.length === 0) return null;

  // Calls whose result renders as an inline MCP-Apps widget are shown by that
  // widget (see McpAppToolMessage), not duplicated in the accordion.
  const visibleToolCalls = toolCalls.filter((tc) => {
    const response = tc.id ? toolResponses.get(tc.id) : undefined;
    return !(response && getMcpAppPayload(response));
  });

  if (visibleToolCalls.length === 0) return null;

  return (
    <div className="chat-container">
      <ToolCallGroup
        items={visibleToolCalls.map((tc) => ({
          toolCall: tc,
          response: tc.id ? toolResponses.get(tc.id) : undefined,
        }))}
      />
    </div>
  );
}

function parseMaybeJson(content: ToolMessage["content"]): {
  structured: unknown | null;
  text: string;
} {
  if (typeof content !== "string") {
    return { structured: null, text: JSON.stringify(content) };
  }
  try {
    const parsed = JSON.parse(content);
    if (
      Array.isArray(parsed) ||
      (typeof parsed === "object" && parsed !== null)
    ) {
      return { structured: parsed, text: content };
    }
  } catch {
    // fall through
  }
  return { structured: null, text: content };
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [expanded, setExpanded] = useState(false);
  const parsed = parseMaybeJson(message.content);

  const lines = parsed.text.split("\n");
  const tooLong = lines.length > 4 || parsed.text.length > 500;
  const displayText =
    tooLong && !expanded
      ? parsed.text.length > 500
        ? parsed.text.slice(0, 500) + "…"
        : lines.slice(0, 4).join("\n") + "\n…"
      : parsed.text;

  return (
    <div className="chat-container mx-auto grid grid-rows-[1fr_auto] gap-2">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
          <h3 className="font-medium text-gray-900">
            {message.name ? (
              <>
                Tool Result:{" "}
                <code className="rounded bg-gray-100 px-2 py-1">
                  {message.name}
                </code>
              </>
            ) : (
              "Tool Result"
            )}
          </h3>
          {message.tool_call_id && (
            <code className="rounded bg-gray-100 px-2 py-1 text-sm">
              {message.tool_call_id}
            </code>
          )}
        </div>
        <div className="p-3">
          {parsed.structured !== null ? (
            <JsonViewer
              value={parsed.structured}
              defaultExpandDepth={1}
              copyLabel="Copy response"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <pre className="max-h-[60vh] overflow-auto break-words p-3 font-mono text-sm whitespace-pre-wrap text-gray-800">
                {displayText}
              </pre>
              {tooLong && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="flex w-full cursor-pointer items-center justify-center border-t border-gray-200 py-2 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
