"use client";

// Renders an MCP-Apps view (render_* dashboards/reports) inline, directly from
// the tool's ToolMessage. The orchestrator's `mcp_app_widgets` middleware
// attaches { html, structuredContent, … } to
// `ToolMessage.additional_kwargs.mcp_app` the moment the tool runs — so the
// widget shows even if the run is later interrupted (the tool result is
// checkpointed) and regardless of the hide-tool-calls toggle.
//
// The view HTML is a spec-compliant MCP-Apps *guest*; this plays the *host* side
// of its JSON-RPC-over-postMessage handshake:
//
//   1. guest -> host  request  "ui/initialize"            (host MUST reply)
//   2. guest -> host  notify   "ui/notifications/initialized"
//   3. host  -> guest notify   "ui/notifications/tool-result" { structuredContent }
//   4. guest -> host  notify   "ui/notifications/size-changed" { height, width }
//
// Fully generic — any MCP-Apps tool works with no per-tool code here.

import { useEffect, useRef, useState } from "react";
import type { ToolMessage } from "@langchain/langgraph-sdk";
import { cn } from "@/lib/utils";

type McpAppPayload = {
  /** The view's self-contained HTML (fetched server-side from its ui:// resource). */
  html?: string;
  /** The tool's structuredContent payload that drives the view. */
  structuredContent?: unknown;
  /** Originating tool name, e.g. "render_stock_report" (for the header). */
  toolName?: string;
  /** The ui:// resource URI (informational). */
  resourceUri?: string;
  /** Optional title supplied by the tool's structuredContent. */
  title?: string;
};

/** Pull the attached MCP-Apps payload off a tool message, or null if absent. */
export function getMcpAppPayload(message: {
  additional_kwargs?: Record<string, unknown>;
}): McpAppPayload | null {
  const p = message.additional_kwargs?.mcp_app;
  return p && typeof p === "object" ? (p as McpAppPayload) : null;
}

// The guest ignores the body of the initialize result (it only awaits the
// promise), but reply spec-correctly for forward-compat.
const PROTOCOL_VERSION = "2026-01-26";
const DEFAULT_HEIGHT = 520;

function prettyToolName(name?: string): string {
  if (!name) return "Interactive view";
  const words = name
    .replace(/^render_/, "")
    .replace(/_/g, " ")
    .trim();
  return words.replace(/\b\w/g, (c) => c.toUpperCase()) || "Interactive view";
}

// The sandboxed iframe + the host side of the MCP-Apps handshake.
function McpAppFrame({
  html,
  structuredContent,
  toolName,
  title,
}: McpAppPayload) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(DEFAULT_HEIGHT);
  // srcDoc is set inside the effect, AFTER the message listener is attached, so
  // we can never miss the guest's one-shot "ui/initialize" request.
  const [srcDoc, setSrcDoc] = useState<string | undefined>(undefined);
  // Read the latest payload from inside the (stable) listener without
  // re-subscribing — the view requests data once, after handshake.
  const dataRef = useRef<unknown>(structuredContent);
  dataRef.current = structuredContent;

  useEffect(() => {
    if (!html) return;

    const onMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      // Only handle messages from *this* widget's iframe (multiple may coexist).
      if (!iframe || event.source !== iframe.contentWindow) return;
      const msg = event.data;
      if (!msg || msg.jsonrpc !== "2.0") return;

      const post = (payload: unknown) =>
        iframe.contentWindow?.postMessage(payload, "*");

      // (1) guest -> host request: reply so the guest's promise resolves.
      if (msg.method === "ui/initialize" && msg.id != null) {
        post({
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            appInfo: { name: "finsharpe-chat", version: "1.0.0" },
            hostCapabilities: {},
            protocolVersion: msg.params?.protocolVersion ?? PROTOCOL_VERSION,
          },
        });
        return;
      }

      switch (msg.method) {
        // (2) guest is ready -> (3) push it the data.
        case "ui/notifications/initialized":
          post({
            jsonrpc: "2.0",
            method: "ui/notifications/tool-result",
            params: { structuredContent: dataRef.current ?? null },
          });
          break;
        // (4) grow the frame to the view's natural height.
        case "ui/notifications/size-changed": {
          const h = msg.params?.height;
          if (typeof h === "number" && h > 0) setHeight(Math.ceil(h));
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("message", onMessage);
    setSrcDoc(html); // listener is live — now load the guest.
    return () => window.removeEventListener("message", onMessage);
  }, [html]);

  if (!html) return null;

  const heading = title || prettyToolName(toolName);

  return (
    <div className="bg-background mt-3 w-full overflow-hidden rounded-lg border">
      <div className="bg-muted/40 flex items-center gap-2 border-b px-3 py-1.5">
        <span className="size-1.5 flex-shrink-0 rounded-full bg-green-500" />
        <span className="text-foreground truncate text-xs font-medium">
          {heading}
        </span>
        <span
          className={cn(
            "ml-auto flex-shrink-0 rounded-full border px-1.5 py-0.5",
            "text-muted-foreground text-[10px] font-medium",
          )}
        >
          Interactive
        </span>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        // allow-scripts (no allow-same-origin) keeps the view sandboxed at a null
        // origin; postMessage + canvas still work, localStorage/cookies do not.
        sandbox="allow-scripts"
        className="block w-full"
        style={{ height, border: 0 }}
        title={heading}
      />
    </div>
  );
}

// Renders a tool message as an MCP-Apps widget, or nothing if it carries no view.
// Shown for the tool message directly (no accordion, ignores hide-tool-calls).
export default function McpAppToolMessage({
  message,
}: {
  message: ToolMessage;
}) {
  const payload = getMcpAppPayload(message);
  if (!payload?.html) return null;
  return <McpAppFrame {...payload} />;
}
