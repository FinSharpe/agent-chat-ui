"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/useUiStore";

/**
 * Sends the prompt another screen handed over with `createNewChat(prompt)`.
 *
 * It fires once the Chat page shows a fresh chat (no thread yet) and nothing
 * is streaming — right after navigating here from Home or Import, and equally
 * when Chat is already open and the hand-off only changes the store. The
 * prompt is read from and cleared in the store before sending, so a re-run
 * of the effect (Strict Mode, a re-render mid-navigation) can never send it
 * twice.
 */
export function usePendingPromptHandoff({
  threadId,
  isLoading,
  send,
}: {
  threadId: string | null;
  isLoading: boolean;
  send: (prompt: string) => void;
}) {
  const pendingPrompt = useUiStore((s) => s.pendingPrompt);

  useEffect(() => {
    if (!pendingPrompt || threadId || isLoading) return;
    const prompt = useUiStore.getState().pendingPrompt;
    if (!prompt) return;
    useUiStore.getState().setPendingPrompt(null);
    send(prompt);
  }, [pendingPrompt, threadId, isLoading, send]);
}
