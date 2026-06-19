import { useState } from "react";
import {
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
      <pre className="text-foreground/80 max-h-[60vh] overflow-auto p-3 font-mono text-xs break-words whitespace-pre-wrap">
        {display}
      </pre>
      {tooLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex w-full cursor-pointer items-center justify-center border-t py-1.5 text-xs"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </>
  );
}

/** Small status glyph used both in the group header and per tool row. */
function StatusBadge({
  status,
  label = true,
}: {
  status: RunStatus;
  label?: boolean;
}) {
  if (status === "running") {
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
        <Loader2 className="h-3 w-3 animate-spin" />
        {label && "Running"}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-error-fg flex items-center gap-1 text-xs font-medium">
        <AlertCircle className="h-3 w-3" />
        {label && "Error"}
      </span>
    );
  }
  return (
    <span className="text-success-fg flex items-center gap-1 text-xs font-medium">
      <CheckCircle2 className="h-3 w-3" />
      {label && "Done"}
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
      <div className="pt-2">{children}</div>
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
          "group/row flex items-center gap-2 py-0.5 text-left",
          expandable ? "cursor-pointer" : "cursor-default",
        )}
        aria-expanded={open}
        disabled={!expandable}
      >
        <span
          className={cn(
            "text-foreground text-sm font-medium transition-colors",
            expandable && "group-hover/row:text-primary",
          )}
        >
          {formatToolName(toolCall.name)}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && expandable && (
          <Panel>
            <div className="border-border bg-bg-subtle ml-7 max-h-[200px] overflow-auto rounded-lg border">
              {hasArgs && (
                <JsonViewer
                  value={toolCall.args}
                  defaultExpandDepth={2}
                  bare
                />
              )}
              {parsed && (
                <div className={cn(hasArgs && "border-border border-t")}>
                  <div className="px-3 pt-2 pb-0.5">
                    <span className="text-foreground text-xs font-semibold">
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
 * Groups every tool call from one AI message into a single sleek accordion.
 * Step 1: open the header → see the tool rows. Step 2: open a row's chip → data.
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
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground hover:text-foreground group/header flex items-center gap-1.5 rounded-md py-1 text-left transition-colors"
        aria-expanded={open}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0 transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="text-sm font-medium">{label}</span>
        {status !== "done" && (
          <span className="ml-1.5">
            <StatusBadge status={status} />
          </span>
        )}
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
            <div className="border-border/70 mt-0.5 ml-[7px] flex flex-col gap-1 border-l pt-1 pb-1 pl-4">
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
