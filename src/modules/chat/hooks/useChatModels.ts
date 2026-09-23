"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { fetchChatModels } from "../api/chatModels";
import { useChatPrefsStore } from "../store/useChatPrefsStore";

/**
 * The pickable models. Until the list answers — or when it cannot — the
 * picker offers Auto alone, as on mobile's first launch; a failed read never
 * pulls a pin, since a list that did not arrive is no evidence a model went.
 */
export function useChatModels() {
  return useQuery({
    queryKey: ["chat-models"],
    queryFn: ({ signal }) => fetchChatModels(signal),
    // The backend re-probes provider accounts every 10 minutes.
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/**
 * Keeps the composer's pick in step with the chat on screen, and moves a pick
 * the server stopped offering back to Auto. Mount once, on the chat page.
 */
export function useChatModelSync() {
  const [threadId] = useQueryState("threadId");
  const openThread = useChatPrefsStore((s) => s.openThread);
  const model = useChatPrefsStore((s) => s.model);
  const forget = useChatPrefsStore((s) => s.forget);
  const { data: models, isSuccess } = useChatModels();

  useEffect(() => {
    openThread(threadId);
  }, [threadId, openThread]);

  useEffect(() => {
    if (!isSuccess || !model) return;
    const row = models.find((m) => m.id === model);
    if (row?.available) return;
    forget(model);
    toast.info(`${row?.label ?? "That model"} isn't available now`, {
      description: "This chat is back on Auto.",
    });
  }, [isSuccess, models, model, forget]);
}

/**
 * The model a Run is pinned to right now: the composer's pick, only while the
 * list offers it — otherwise Auto, which is also what the pill shows. Mobile's
 * `canPin`: a pick the list has not confirmed is never sent.
 */
export function usePinnedModel(): string | null {
  const model = useChatPrefsStore((s) => s.model);
  const { data: models } = useChatModels();
  if (!model || !models) return null;
  return models.some((m) => m.id === model && m.available) ? model : null;
}
