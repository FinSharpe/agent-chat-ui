/**
 * How a turn's tool calls are grouped in the transcript. Mirrors
 * finsharpe-mobile's `tool_activity.dart`; change the two together.
 *
 * A call keeps its position in the conversation and its result is paired by
 * id, even when parallel calls finish in a different order. Prose is a hard
 * grouping boundary: consecutive tool rounds share one group, but an answer,
 * a report or a connect card closes it, and never removes a call from the
 * inspectable record.
 */
import type { AIMessage, Message, ToolMessage } from "@langchain/langgraph-sdk";
import { DO_NOT_RENDER_ID_PREFIX } from "./ensure-tool-responses";

type ToolCall = NonNullable<AIMessage["tool_calls"]>[number];

export interface ToolActivityStep {
  key: string;
  call: ToolCall;
  result?: ToolMessage;
}

export type TurnPart =
  | { kind: "message"; key: string; message: Message }
  | { kind: "tools"; key: string; steps: ToolActivityStep[] };

export const stepDone = (step: ToolActivityStep) => !!step.result;
export const stepFailed = (step: ToolActivityStep) =>
  step.result?.status === "error";

/** The first call still waiting for its result — the one the run is on. */
export function currentStep(
  steps: readonly ToolActivityStep[],
): ToolActivityStep | undefined {
  return steps.find((step) => !stepDone(step));
}

export interface ProjectTurnOptions {
  /** An AI message that draws something (text, a summary card). */
  isMessageVisible: (message: Message) => boolean;
  /** A tool result drawn in place of its payload — a report or a connect
   *  card. It closes the open group and is drawn after it. */
  isToolBoundary: (message: ToolMessage) => boolean;
  /** The calls an AI message makes; defaults to its `tool_calls`. */
  toolCallsOf?: (message: AIMessage) => AIMessage["tool_calls"];
}

/**
 * Projects the messages of one turn (everything between two human messages)
 * into the parts the transcript draws: AI messages, tool groups and the tool
 * results drawn as components. Every AI message is kept as a part, visible or
 * not, so whatever else it carries (interrupts, custom UI) still renders; only
 * a visible one closes the open group. An invisible one is drawn after the
 * group holding its calls, where the old per-message layout drew its extras.
 */
export function projectTurn(
  turn: readonly Message[],
  {
    isMessageVisible,
    isToolBoundary,
    toolCallsOf = (message) => message.tool_calls,
  }: ProjectTurnOptions,
): TurnPart[] {
  const results = new Map<string, ToolMessage>();
  for (const message of turn) {
    // A result the client made up to close a call (see ensure-tool-responses)
    // is not a response: the call never answered.
    if (
      message.type === "tool" &&
      message.tool_call_id &&
      !message.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)
    ) {
      results.set(message.tool_call_id, message);
    }
  }

  const parts: TurnPart[] = [];
  let pending: ToolActivityStep[] = [];
  let deferred: TurnPart[] = [];
  const flush = () => {
    if (pending.length > 0) {
      parts.push({
        kind: "tools",
        key: `tools:${pending[0].key}`,
        steps: pending,
      });
    }
    parts.push(...deferred);
    pending = [];
    deferred = [];
  };

  turn.forEach((message, index) => {
    if (message.type === "ai") {
      const part: TurnPart = {
        kind: "message",
        key: `message:${message.id ?? index}`,
        message,
      };
      if (isMessageVisible(message)) {
        flush();
        parts.push(part);
      } else {
        deferred.push(part);
      }
      (toolCallsOf(message) ?? []).forEach((call, callIndex) => {
        if (!call.name?.trim()) return;
        pending.push({
          key: call.id || `${message.id ?? index}:${callIndex}`,
          call,
          result: call.id ? results.get(call.id) : undefined,
        });
      });
    } else if (message.type === "tool" && isToolBoundary(message)) {
      flush();
      parts.push({
        kind: "message",
        key: `message:${message.id ?? index}`,
        message,
      });
    }
  });
  flush();
  return parts;
}

/** Splits a conversation into turns: each human message and what follows. */
export function splitTurns(
  messages: readonly Message[],
): { human?: Message; turn: Message[] }[] {
  const turns: { human?: Message; turn: Message[] }[] = [];
  for (const message of messages) {
    if (message.type === "human") {
      turns.push({ human: message, turn: [] });
    } else if (turns.length === 0) {
      turns.push({ turn: [message] });
    } else {
      turns[turns.length - 1].turn.push(message);
    }
  }
  return turns;
}
