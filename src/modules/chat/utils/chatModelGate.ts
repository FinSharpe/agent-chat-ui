import type { QueryClient } from "@tanstack/react-query";
import { useChatPrefsStore } from "../store/useChatPrefsStore";
import { useModelChoiceStore } from "../store/useModelChoiceStore";
import { createModelGate, type ModelGate } from "./modelGate";
import {
  cachedModels,
  modelsOlderThan,
  PIN_CONFIRM_MS,
  refreshModels,
} from "./modelList";

/**
 * The chat's model gate, wired to the app's stores and its copy of
 * `GET /api/models` (finsharpe-agents#255). `getScope` names the chat a send
 * was asked for, so one confirmed after the user moved on is dropped.
 */
export function chatModelGate(
  queryClient: QueryClient,
  getScope?: () => unknown,
): ModelGate {
  return createModelGate({
    getModel: () => useChatPrefsStore.getState().model,
    getModels: () => cachedModels(queryClient),
    hold: (send) => useModelChoiceStore.getState().hold(send),
    refresh: () => void refreshModels(queryClient),
    needsConfirm: () => modelsOlderThan(queryClient, PIN_CONFIRM_MS),
    confirm: () => refreshModels(queryClient),
    getScope,
  });
}
