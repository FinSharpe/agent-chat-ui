"use client";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";

export function useAssistantId() {
  return useQueryState(
    "assistantId",
    parseAsString.withDefault(process.env.NEXT_PUBLIC_ASSISTANT_ID ?? ""),
  );
}

export function useApiUrl() {
  return useQueryState(
    "apiUrl",
    parseAsString.withDefault(process.env.NEXT_PUBLIC_API_URL ?? ""),
  );
}

export function useHideToolCalls() {
  return useQueryState("hideToolCalls", parseAsBoolean.withDefault(false));
}
