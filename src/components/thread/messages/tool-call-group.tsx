"use client";

import { useEffect, useRef, useState } from "react";
import { ToolMessage } from "@langchain/langgraph-sdk";
import { getPortfolioConnect } from "@/lib/portfolio-connect";
import {
  stepDone,
  stepFailed,
  type ToolActivityStep,
} from "@/lib/tool-activity";
import { cn } from "@/lib/utils";
import { CrestText } from "./crest-text";
import { JsonViewer } from "./json-viewer";
import { formatToolName } from "./tool-labels";

/**
 * The run's tool activity and its narration, after finsharpe-mobile's
 * `tool_activity.dart` (#132, #147); change the two together. Text only: no
 * status icons and no spinner — the call the run is on lights up (CrestText),
 * a failed one says so in amber, the rest are quiet words.
 */
export type RunPhase =
  | "thinking"
  | "running"
  | "preparing"
  | "checking"
  | "stopped"
  | "failed"
  | "settled";

export const isLive = (phase: RunPhase) =>
  phase === "thinking" ||
  phase === "running" ||
  phase === "preparing" ||
  phase === "checking";

const RUN_LINE: Record<RunPhase, string> = {
  thinking: "Thinking",
  running: "Retrieving data",
  preparing: "Preparing answer",
  checking: "Checking sources",
  stopped: "Stopped",
  failed: "Run failed",
  settled: "",
};

function ToolWords({
  label,
  moving,
  warning = false,
}: {
  label: string;
  moving: boolean;
  warning?: boolean;
}) {
  return (
    <span className="flex min-h-[26px] items-center py-[3px] text-left">
      {moving ? (
        <CrestText
          warning={warning}
          className="text-[11px] leading-[1.45]"
        >
          {label}
        </CrestText>
      ) : (
        <span
          className={cn(
            "text-[11px] leading-[1.45]",
            warning ? "tool-words--warning text-amber-600" : "text-slate-500",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}

/**
 * The run-level narration, drawn at the end of the turn only when no tool
 * row is already carrying the active state.
 */
export function RunLine({ phase }: { phase: RunPhase }) {
  if (phase === "settled") return null;
  return (
    <div
      role="status"
      aria-live="polite"
    >
      <ToolWords
        label={RUN_LINE[phase]}
        moving={isLive(phase)}
        warning={phase === "failed"}
      />
    </div>
  );
}

/**
 * A portfolio tool that found nothing to read answers with a connect card
 * (#79). Its payload is an `error` object saying only what the card says, so
 * the row stays as the record that the tool ran, but neither opens nor reads
 * as failed — a failure beside an invitation reads as a broken run.
 */
const answeredByCard = (response?: ToolMessage) =>
  !!response && getPortfolioConnect(response) !== null;

/**
 * The closed group's header. A failure count alone ("2 failed") reads as the
 * number of calls made, so it is given against the total — a deliberate
 * departure from mobile's `· N failed`.
 */
export function groupLabel(total: number, failures: number): string {
  return failures > 0
    ? `Retrieving data · ${failures} of ${total} failed`
    : "Retrieving data";
}

/**
 * One or two calls stay direct. Three or more form one local disclosure,
 * closed by default, whose header lights up while it holds the active call.
 */
export function ToolCallGroup({
  steps,
  phase,
  activeCallKey,
}: {
  steps: ToolActivityStep[];
  phase: RunPhase;
  /** The call the run is on, while it is live. */
  activeCallKey?: string;
}) {
  const [groupOpen, setGroupOpen] = useState(false);
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(
    () => new Set(),
  );
  const grouped = steps.length > 2;

  // A third arriving call must not hide the payload the reader is inspecting.
  const wasGrouped = useRef(grouped);
  useEffect(() => {
    if (!wasGrouped.current && grouped && expandedCalls.size > 0) {
      setGroupOpen(true);
    }
    wasGrouped.current = grouped;
  }, [grouped, expandedCalls]);

  const open = !grouped || groupOpen;
  const ownsActive =
    isLive(phase) && steps.some((step) => step.key === activeCallKey);
  const failures = steps.filter(
    (step) => stepFailed(step) && !answeredByCard(step.result),
  ).length;

  const toggleCall = (key: string) =>
    setExpandedCalls((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const rows = steps.map((step) => (
    <ToolRow
      key={step.key}
      step={step}
      phase={phase}
      active={ownsActive && open && step.key === activeCallKey}
      open={expandedCalls.has(step.key)}
      onToggle={() => toggleCall(step.key)}
    />
  ));

  return (
    <div className="mb-2 flex w-full max-w-[92%] flex-col">
      {grouped && (
        <button
          type="button"
          onClick={() => setGroupOpen((o) => !o)}
          aria-expanded={open}
          className="w-fit cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:ring-[#063BAA]/30 focus-visible:outline-none"
        >
          <ToolWords
            label={groupLabel(steps.length, failures)}
            moving={ownsActive && !open}
            warning={failures > 0}
          />
        </button>
      )}
      {open &&
        (grouped ? (
          <div className="max-h-[240px] overflow-y-auto border-l border-slate-200 pl-2">
            {rows}
          </div>
        ) : (
          rows
        ))}
    </div>
  );
}

function ToolRow({
  step,
  phase,
  active,
  open: expanded,
  onToggle,
}: {
  step: ToolActivityStep;
  phase: RunPhase;
  active: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const answered = answeredByCard(step.result);
  const open = !answered && expanded;
  const done = stepDone(step);
  const unfinished = !done && !isLive(phase);
  const failed = stepFailed(step) && !answered;
  const status = failed
    ? "failed"
    : done
      ? "completed"
      : unfinished
        ? "unfinished"
        : active
          ? "running"
          : "pending";
  const suffix = failed ? " · failed" : unfinished ? " · unfinished" : "";
  const label = formatToolName(step.call.name, { active }) + suffix;
  const missing = done
    ? undefined
    : phase === "stopped"
      ? "Stopped before a response arrived."
      : phase === "failed"
        ? "Run failed before a response arrived."
        : phase === "settled"
          ? "No response was recorded."
          : "No response yet.";
  const words = (
    <ToolWords
      label={label}
      moving={active}
      warning={failed}
    />
  );

  return (
    <div className="flex flex-col">
      {answered ? (
        <div aria-label={`${label}, ${status}`}>{words}</div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${label}, ${status}`}
          className="w-full cursor-pointer rounded-sm text-left focus-visible:ring-2 focus-visible:ring-[#063BAA]/30 focus-visible:outline-none"
        >
          {words}
        </button>
      )}
      {open && (
        <div className="pt-0.5 pb-1">
          <ToolPayloadView
            request={step.call.args}
            response={step.result?.content}
            missingResponse={missing}
          />
        </div>
      )}
    </div>
  );
}

/** Request and response, each in its own quiet block, one scroll between
 *  them. After mobile's `tool_payload_view.dart`. */
function ToolPayloadView({
  request,
  response,
  missingResponse,
}: {
  request: unknown;
  response: ToolMessage["content"] | undefined;
  missingResponse?: string;
}) {
  return (
    <div className="flex max-h-[184px] flex-col gap-1.5 overflow-y-auto">
      <PayloadBlock
        title="Request parameters"
        payload={parsePayload(request)}
      />
      <PayloadBlock
        title="Response"
        payload={
          missingResponse !== undefined
            ? { value: missingResponse, literal: true }
            : parsePayload(response)
        }
      />
    </div>
  );
}

function PayloadBlock({
  title,
  payload,
}: {
  title: string;
  payload: { value: unknown; literal: boolean };
}) {
  const tree =
    !payload.literal &&
    payload.value !== null &&
    typeof payload.value === "object";
  return (
    <div className="shrink-0 rounded-[6px] border border-slate-100 bg-slate-50 px-[9px] py-2">
      <div className="pb-1.5 text-[10px] leading-[1.5] font-medium text-[#0A1F4D]">
        {title}
      </div>
      {tree ? (
        <JsonViewer
          value={payload.value}
          defaultExpandDepth={1}
          maxHeight="none"
          className="p-0 text-[10.5px]"
          bare
        />
      ) : (
        <pre className="font-mono text-[10.5px] leading-[1.65] break-words whitespace-pre-wrap text-slate-500">
          {payload.literal
            ? String(payload.value)
            : JSON.stringify(payload.value)}
        </pre>
      )}
    </div>
  );
}

/**
 * LangChain can wrap textual tool results in standard content blocks; join
 * those, then read JSON when the text is JSON. Mixed or non-text blocks stay
 * data rather than being silently dropped.
 */
export function parsePayload(payload: unknown): {
  value: unknown;
  literal: boolean;
} {
  if (
    Array.isArray(payload) &&
    payload.length > 0 &&
    payload.every(
      (b) =>
        b !== null &&
        typeof b === "object" &&
        (b as Record<string, unknown>).type === "text" &&
        typeof (b as Record<string, unknown>).text === "string",
    )
  ) {
    payload = payload.map((b) => (b as { text: string }).text).join("");
  }
  if (typeof payload === "string") {
    try {
      return { value: JSON.parse(payload), literal: false };
    } catch {
      return {
        value: payload === "" ? "(empty text)" : payload,
        literal: true,
      };
    }
  }
  return { value: payload ?? null, literal: false };
}
