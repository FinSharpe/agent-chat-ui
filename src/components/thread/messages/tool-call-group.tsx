import { useState } from "react";
import { ChevronRight, Check, Loader2, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { cn } from "@/lib/utils";
import { JsonViewer } from "./json-viewer";
import { formatToolName } from "./tool-labels";

type ToolCall = NonNullable<AIMessage["tool_calls"]>[number];

export interface ToolCallItem {
  toolCall: ToolCall;
  response?: ToolMessage;
}

type RunStatus = "running" | "error" | "done";

function statusOf(response?: ToolMessage): RunStatus {
  if (!response) return "running";
  if (response.status === "error") return "error";
  return "done";
}

function aggregateStatus(items: ToolCallItem[]): RunStatus {
  if (items.some((i) => statusOf(i.response) === "running")) return "running";
  if (items.some((i) => statusOf(i.response) === "error")) return "error";
  return "done";
}

/** MCP tool results arrive as content blocks: [{ type: "text", text }, …].
 *  Concatenate the text parts, or null if `value` isn't that shape. */
function extractTextBlocks(value: unknown): string | null {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (b) =>
        b !== null &&
        typeof b === "object" &&
        (b as Record<string, unknown>).type === "text" &&
        typeof (b as Record<string, unknown>).text === "string",
    )
  ) {
    return value
      .map((b) => (b as Record<string, string>).text)
      .join("");
  }
  return null;
}

function tryParseObject(text: string): unknown | null {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) || (typeof parsed === "object" && parsed !== null)) {
      return parsed;
    }
  } catch {
    // not JSON
  }
  return null;
}

function parseResponseContent(content: ToolMessage["content"]): {
  structured: unknown | null;
  text: string;
} {
  // First pass: turn content into a parsed value + a raw string form.
  let raw: string;
  let parsed: unknown = null;
  if (typeof content === "string") {
    raw = content;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }
  } else {
    parsed = content;
    raw = JSON.stringify(content);
  }

  // Unwrap MCP text blocks, then re-parse the inner payload — that inner text is
  // usually itself stringified JSON (the real result the user cares about).
  const inner = extractTextBlocks(parsed);
  if (inner !== null) {
    const innerStructured = tryParseObject(inner);
    return innerStructured !== null
      ? { structured: innerStructured, text: inner }
      : { structured: null, text: inner };
  }

  if (parsed !== null && (Array.isArray(parsed) || typeof parsed === "object")) {
    return { structured: parsed, text: raw };
  }
  return { structured: null, text: raw };
}

function TextFallback({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const tooLong = lines.length > 4 || text.length > 500;
  const display =
    tooLong && !expanded
      ? text.length > 500
        ? text.slice(0, 500) + "…"
        : lines.slice(0, 4).join("\n") + "\n…"
      : text;

  return (
    <>
      <pre className="max-h-[60vh] overflow-auto p-3 font-mono text-[11px] break-words whitespace-pre-wrap text-[#0A1F4D]">
        {display}
      </pre>
      {tooLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="hover-tint flex w-full cursor-pointer items-center justify-center border-t border-slate-100 py-1.5 text-[11px] font-medium text-slate-500 hover:text-[#063BAA]"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </>
  );
}

/**
 * The status as a small round tile: blue spinner while running, rose on an
 * error, mint check when done.
 */
function StatusTile({
  status,
  size = "md",
}: {
  status: RunStatus;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  const icon = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  if (status === "running") {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]",
          box,
        )}
      >
        <Loader2 className={cn(icon, "animate-spin")} />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className={cn(
          "chat-error-tile flex shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600",
          box,
        )}
      >
        <AlertCircle className={icon} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#97edcc]/25 text-[#0A9E6E]",
        box,
      )}
    >
      <Check
        className={icon}
        strokeWidth={3}
      />
    </span>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden"
    >
      <div className="pt-1 pb-1.5">{children}</div>
    </motion.div>
  );
}

/** A single tool: click the title to disclose its request and response. */
function ToolRow({ toolCall, response }: ToolCallItem) {
  const [open, setOpen] = useState(false);
  const hasArgs = Object.keys(toolCall.args ?? {}).length > 0;
  const parsed = response ? parseResponseContent(response.content) : null;
  const expandable = hasArgs || parsed !== null;

  return (
    <div className="flex flex-col">
      <button
        onClick={() => expandable && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-tile px-2 py-1.5 text-left transition-colors",
          expandable ? "hover-tint cursor-pointer" : "cursor-default",
        )}
        aria-expanded={open}
        disabled={!expandable}
      >
        <StatusTile
          status={statusOf(response)}
          size="sm"
        />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#0A1F4D]">
          {formatToolName(toolCall.name)}
        </span>
        {expandable && (
          <ChevronRight
            className={cn(
              "h-3 w-3 shrink-0 text-slate-400 transition-transform",
              open && "rotate-90",
            )}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && expandable && (
          <Panel>
            <div className="ml-6 max-h-[240px] overflow-auto rounded-nested border border-slate-100 bg-white">
              {hasArgs && (
                <JsonViewer
                  value={toolCall.args}
                  defaultExpandDepth={2}
                  bare
                />
              )}
              {parsed && (
                <div className={cn(hasArgs && "border-t border-slate-100")}>
                  <div className="px-3 pt-2 pb-0.5">
                    <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
                      Response
                    </span>
                  </div>
                  {parsed.structured !== null ? (
                    <JsonViewer
                      value={parsed.structured}
                      defaultExpandDepth={1}
                      bare
                    />
                  ) : (
                    <TextFallback text={parsed.text} />
                  )}
                </div>
              )}
            </div>
          </Panel>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Groups every tool call from one AI message into one quiet row: a status
 * tile and what the agent did. Open it for the individual tools, then a tool
 * for its request and response.
 */
export function ToolCallGroup({ items }: { items: ToolCallItem[] }) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const status = aggregateStatus(items);
  const single = items.length === 1;
  const label = single
    ? formatToolName(items[0].toolCall.name)
    : `Used ${items.length} tools`;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group/header hover-tint -ml-1 inline-flex max-w-full items-center gap-2 rounded-full py-1 pr-3 pl-1 text-left transition-colors"
        aria-expanded={open}
      >
        <StatusTile status={status} />
        <span className="truncate text-[11px] font-medium text-slate-500 transition-colors group-hover/header:text-[#0A1F4D]">
          {label}
        </span>
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-slate-400 transition-transform",
            open && "rotate-90",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 flex max-w-[92%] flex-col gap-0.5 rounded-nested border border-slate-100 bg-slate-50/60 p-1.5">
              {items.map((item, idx) => (
                <ToolRow
                  key={item.toolCall.id ?? idx}
                  {...item}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
