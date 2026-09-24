"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { type ChatModelOption, fetchChatModels } from "../api/chatModels";
import { useChatPrefsStore } from "../store/useChatPrefsStore";
import { useModelChoiceStore } from "../store/useModelChoiceStore";
import { createModelGate, type ModelGate } from "../utils/modelGate";
import { type PinState, pinState } from "../utils/pin";

export const CHAT_MODELS_KEY = ["chat-models"] as const;

/**
 * The pickable models. Until the list answers — or when it cannot — the
 * picker offers Auto alone, as on mobile's first launch; a failed read never
 * touches a pin, since a list that did not arrive is no evidence a model went.
 */
export function useChatModels() {
  return useQuery({
    queryKey: CHAT_MODELS_KEY,
    queryFn: ({ signal }) => fetchChatModels(signal),
    // The backend re-probes provider accounts every 10 minutes.
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/**
 * Keeps the composer's pick in step with the chat on screen, and remembers
 * each model's label so a pin the list later drops is still shown by name.
 * It never changes a pick: a pin the server stops offering stays the pin,
 * marked unavailable, until the user chooses (finsharpe-agents#255). Mount
 * once, on the chat page.
 */
export function useChatModelSync() {
  const [threadId] = useQueryState("threadId");
  const openThread = useChatPrefsStore((s) => s.openThread);
  const rememberLabels = useChatPrefsStore((s) => s.rememberLabels);
  const { data: models } = useChatModels();

  useEffect(() => {
    openThread(threadId);
    // A send held for the chat being left must not go out in the next one.
    useModelChoiceStore.getState().cancel();
  }, [threadId, openThread]);

  useEffect(() => {
    if (models) rememberLabels(models);
  }, [models, rememberLabels]);
}

/** The pick as the composer shows it: Auto, or a pin and whether it can run. */
export function usePinState(): PinState {
  const model = useChatPrefsStore((s) => s.model);
  const labels = useChatPrefsStore((s) => s.labels);
  const { data: models } = useChatModels();
  return useMemo(
    () => pinState(model, models, labels),
    [model, models, labels],
  );
}

/**
 * The gate every chat send goes through: it runs the send on the pick, or —
 * when the pin cannot run — holds it and opens the picker for the user to
 * choose. A pin is never dropped to Auto to get a Run out.
 */
export function useModelGate(): ModelGate {
  const queryClient = useQueryClient();
  return useMemo(
    () =>
      createModelGate({
        getModel: () => useChatPrefsStore.getState().model,
        getModels: () =>
          queryClient.getQueryData<ChatModelOption[]>(CHAT_MODELS_KEY),
        hold: (send) => useModelChoiceStore.getState().hold(send),
        refresh: () =>
          void queryClient.invalidateQueries({ queryKey: CHAT_MODELS_KEY }),
      }),
    [queryClient],
  );
}
