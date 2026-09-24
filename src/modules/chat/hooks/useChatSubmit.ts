"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import type { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { useArtifactContext } from "@/components/thread/artifact";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { useStreamContext } from "@/providers/Stream";
import { runConfigurable } from "../store/useChatPrefsStore";
import { useModelGate } from "./useChatModels";

/** The artifact context a turn carries: none when it is empty. */
function sentContext<T extends object>(context: T): T | undefined {
  return Object.keys(context).length > 0 ? context : undefined;
}

interface SubmitOptions {
  /**
   * The message opens a brand-new chat. Whatever the stream still holds
   * belongs to the chat being left, so nothing of it is carried over.
   */
  fresh?: boolean;
  /**
   * Runs when the message actually goes out — at once, or later, once the
   * user has chosen a model for a chat whose pin could not run.
   */
  onSent?: () => void;
  /** The user was asked to choose a model and closed the picker instead. */
  onCancel?: () => void;
}

/**
 * The one way a user turn reaches the agent — typed, a starter prompt, a
 * suggested next step or a prompt handed over from another page all go
 * through here, so they share the selected model, the artifact context and
 * the optimistic update.
 *
 * Every send passes the model gate (finsharpe-agents#255): a chat pinned to a
 * model the server cannot serve right now sends nothing — not even on Auto —
 * and the picker opens for the user to choose; the send then goes out on
 * their choice. So the stream and artifact context are read when the send
 * goes out, through refs, not captured when it was asked for.
 */
export function useChatSubmit() {
  const stream = useStreamContext();
  const [artifactContext] = useArtifactContext();
  const gate = useModelGate();

  const streamRef = useRef(stream);
  const artifactRef = useRef(artifactContext);
  useEffect(() => {
    streamRef.current = stream;
    artifactRef.current = artifactContext;
  }, [stream, artifactContext]);

  /**
   * Returns true when the message went out now; false when there was nothing
   * to send, or when it is waiting for the user to choose a model.
   */
  const submitMessage = useCallback(
    (
      text: string,
      blocks: Base64ContentBlock[] = [],
      { fresh = false, onSent, onCancel }: SubmitOptions = {},
    ) => {
      const trimmed = text.trim();
      if (!trimmed && blocks.length === 0) return false;

      return gate((model) => {
        const stream = streamRef.current;
        const newHumanMessage: Message = {
          id: uuidv4(),
          type: "human",
          content: [
            ...(trimmed ? [{ type: "text", text }] : []),
            ...blocks,
          ] as Message["content"],
        };

        // Every earlier tool call needs a response before a new turn, or the
        // model provider rejects the history.
        const toolMessages = fresh
          ? []
          : ensureToolCallsHaveResponses(stream.messages);
        const context = sentContext(artifactRef.current);

        stream.submit(
          { messages: [...toolMessages, newHumanMessage], context },
          {
            streamMode: ["values"],
            config: { configurable: runConfigurable(model) },
            optimisticValues: (prev) => ({
              ...prev,
              context,
              // The previous turn's chips must not linger under the new one.
              next_prompt_suggestions: [],
              messages: [
                ...(fresh ? [] : (prev.messages ?? [])),
                ...toolMessages,
                newHumanMessage,
              ],
            }),
          },
        );
        onSent?.();
      }, onCancel);
    },
    [gate],
  );

  /** Re-runs the agent from the checkpoint before an answer. */
  const regenerate = useCallback(
    (parentCheckpoint: Checkpoint | null | undefined) => {
      gate((model) => {
        streamRef.current.submit(undefined, {
          checkpoint: parentCheckpoint,
          streamMode: ["values"],
          config: { configurable: runConfigurable(model) },
        });
      });
    },
    [gate],
  );

  /**
   * Sends the last user turn again after a run failed — the send never
   * reached the agent, or the stream dropped part-way through an answer.
   *
   * `regenerate` cannot cover this: a run that never started has no
   * checkpoint to rewind to. The same message object is re-submitted with its
   * original id, so LangGraph's message reducer replaces it rather than
   * appending a second copy if the failed run did persist it. Whatever the
   * failed run left on screen after that turn (half an answer, a tool call)
   * is dropped optimistically, because the retry is about to produce it
   * again.
   *
   * Returns false when there is no user turn to resend (the conversation
   * itself failed to load), so the caller can fall back. A resend waiting for
   * a model choice counts as handled.
   */
  const retryLastTurn = useCallback(() => {
    const hasHumanTurn = streamRef.current.messages.some(
      (m) => m.type === "human",
    );
    if (!hasHumanTurn) return false;

    gate((model) => {
      const stream = streamRef.current;
      const messages = stream.messages;
      let index = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === "human") {
          index = i;
          break;
        }
      }
      if (index < 0) return;

      const humanMessage = messages[index];
      const kept = messages.slice(0, index + 1);
      const context = sentContext(artifactRef.current);

      stream.submit(
        { messages: [humanMessage], context },
        {
          streamMode: ["values"],
          config: { configurable: runConfigurable(model) },
          optimisticValues: (prev) => ({
            ...prev,
            context,
            next_prompt_suggestions: [],
            messages: kept,
          }),
        },
      );
    });
    return true;
  }, [gate]);

  return { submitMessage, regenerate, retryLastTurn };
}
