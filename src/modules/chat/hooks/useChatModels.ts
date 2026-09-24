"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { useChatPrefsStore } from "../store/useChatPrefsStore";
import { useModelChoiceStore } from "../store/useModelChoiceStore";
import { chatModelGate } from "../utils/chatModelGate";
import type { ModelGate } from "../utils/modelGate";
import { chatModelsQuery, refreshModels } from "../utils/modelList";
import { type PinState, pinState } from "../utils/pin";

/**
 * The pickable models. Until the list answers — or when it cannot — the
 * picker offers Auto alone, as on mobile's first launch; a failed read never
 * touches a pin, since a list that did not arrive is no evidence a model went.
 */
export function useChatModels() {
  return useQuery(chatModelsQuery());
}

/**
 * Keeps the composer's pick in step with the chat on screen, and remembers
 * each model's label so a pin the list later drops is still shown by name.
 * It never changes a pick: a pin the server stops offering stays the pin,
 * marked unavailable, until the user chooses (finsharpe-agents#255). Mount
 * once, on the chat page.
 *
 * Opening a chat reads the list again, so its pin shows as the server offers
 * it now — not as it was when the page loaded, up to ten minutes ago.
 */
export function useChatModelSync() {
  const [threadId] = useQueryState("threadId");
  const openThread = useChatPrefsStore((s) => s.openThread);
  const rememberLabels = useChatPrefsStore((s) => s.rememberLabels);
  const queryClient = useQueryClient();
  const { data: models } = useChatModels();

  useEffect(() => {
    openThread(threadId);
    // A send held for the chat being left must not go out in the next one.
    useModelChoiceStore.getState().cancel();
    void refreshModels(queryClient);
  }, [threadId, openThread, queryClient]);

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
 * choose. A pin is never dropped to Auto to get a Run out. A pinned send on a
 * list older than `PIN_CONFIRM_MS` reads the list again first.
 */
export function useModelGate(): ModelGate {
  const queryClient = useQueryClient();
  const [threadId] = useQueryState("threadId");
  const threadRef = useRef(threadId);
  useEffect(() => {
    threadRef.current = threadId;
  }, [threadId]);
  return useMemo(
    () => chatModelGate(queryClient, () => threadRef.current),
    [queryClient],
  );
}
