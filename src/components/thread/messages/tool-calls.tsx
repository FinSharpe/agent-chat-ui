import { useStreamContext } from "@/providers/Stream";
import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useMemo } from "react";
import { getMcpAppPayload } from "./client-components/mcp-app";
import { ToolCallGroup } from "./tool-call-group";

/** One AI message's tool calls, paired with their results, as one group. */
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
    <ToolCallGroup
      items={visibleToolCalls.map((tc) => ({
        toolCall: tc,
        response: tc.id ? toolResponses.get(tc.id) : undefined,
      }))}
    />
  );
}
