"use client";

import { useCallback } from "react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import type { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { useArtifactContext } from "@/components/thread/artifact";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { useStreamContext } from "@/providers/Stream";
import { runConfigurable } from "../store/useChatPrefsStore";
import { usePinnedModel } from "./useChatModels";

interface SubmitOptions {
  /**
   * The message opens a brand-new chat. Whatever the stream still holds
   * belongs to the chat being left, so nothing of it is carried over.
   */
  fresh?: boolean;
}

/**
 * The one way a user turn reaches the agent — typed, a starter prompt, a
 * suggested next step or a prompt handed over from another page all go
 * through here, so they share the selected model, the artifact context and
 * the optimistic update.
 */
export function useChatSubmit() {
  const stream = useStreamContext();
  const [artifactContext] = useArtifactContext();
  const model = usePinnedModel();

  const submitMessage = useCallback(
    (
      text: string,
      blocks: Base64ContentBlock[] = [],
      { fresh = false }: SubmitOptions = {},
    ) => {
      const trimmed = text.trim();
      if (!trimmed && blocks.length === 0) return false;

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
      const context =
        Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

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
      return true;
    },
    [stream, artifactContext, model],
  );

  /** Re-runs the agent from the checkpoint before an answer. */
  const regenerate = useCallback(
    (parentCheckpoint: Checkpoint | null | undefined) => {
      stream.submit(undefined, {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        config: { configurable: runConfigurable(model) },
      });
    },
    [stream, model],
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
   * itself failed to load), so the caller can fall back.
   */
  const retryLastTurn = useCallback(() => {
    const messages = stream.messages;
    let index = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "human") {
        index = i;
        break;
      }
    }
    if (index < 0) return false;

    const humanMessage = messages[index];
    const kept = messages.slice(0, index + 1);
    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

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
    return true;
  }, [stream, artifactContext, model]);

  return { submitMessage, regenerate, retryLastTurn };
}
