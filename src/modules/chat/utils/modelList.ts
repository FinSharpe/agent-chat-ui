import type { QueryClient } from "@tanstack/react-query";
import { type ChatModelOption, fetchChatModels } from "../api/chatModels";

export const CHAT_MODELS_KEY = ["chat-models"] as const;

/** The backend re-probes provider accounts every 10 minutes. */
export const MODELS_STALE_MS = 10 * 60 * 1000;

/**
 * How old the list may be when a pinned send goes out. Past this it is read
 * again first, so a model the server stopped offering — marked unavailable or
 * dropped from the list — holds the send instead of going out on a list the
 * client read minutes ago (finsharpe-agents#255).
 */
export const PIN_CONFIRM_MS = 30 * 1000;

/** A re-read that takes longer than this does not hold a send up. */
export const CONFIRM_TIMEOUT_MS = 4000;

export type ModelsFetcher = (
  signal?: AbortSignal,
) => Promise<ChatModelOption[]>;

/** The one definition of the list's query, shared by the hook and the gate. */
export function chatModelsQuery(fetcher: ModelsFetcher = fetchChatModels) {
  return {
    queryKey: CHAT_MODELS_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) => fetcher(signal),
    staleTime: MODELS_STALE_MS,
    retry: false,
  } as const;
}

/** The list as last answered; undefined while it never has. */
export function cachedModels(
  queryClient: QueryClient,
): ChatModelOption[] | undefined {
  return queryClient.getQueryData<ChatModelOption[]>(CHAT_MODELS_KEY);
}

/** True when the list has not been read within `maxAgeMs`. */
export function modelsOlderThan(
  queryClient: QueryClient,
  maxAgeMs: number,
  now: number = Date.now(),
): boolean {
  const updatedAt =
    queryClient.getQueryState(CHAT_MODELS_KEY)?.dataUpdatedAt ?? 0;
  return updatedAt === 0 || now - updatedAt >= maxAgeMs;
}

/**
 * Reads the list again unless it was read within `maxAgeMs` (0: always).
 * Never throws: a read that fails or runs past `timeoutMs` leaves the last
 * list that did answer in place — a list that did not arrive is no evidence
 * a model went.
 *
 * A read past the cap is cancelled, not just stopped being waited on: react
 * query hands every later refresh the request already in flight, so a hung
 * one left running would make each of them wait out the cap again without
 * ever getting a fresh list. Cancelling puts the last good list back and
 * lets the next refresh start a new request.
 */
export async function refreshModels(
  queryClient: QueryClient,
  {
    maxAgeMs = 0,
    timeoutMs = CONFIRM_TIMEOUT_MS,
    fetcher,
  }: { maxAgeMs?: number; timeoutMs?: number; fetcher?: ModelsFetcher } = {},
): Promise<ChatModelOption[] | undefined> {
  const TIMED_OUT = Symbol("timed out");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const outcome = await Promise.race([
      queryClient.fetchQuery({
        ...chatModelsQuery(fetcher),
        staleTime: maxAgeMs,
      }),
      new Promise<typeof TIMED_OUT>((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
      }),
    ]);
    if (outcome === TIMED_OUT) {
      await queryClient.cancelQueries({ queryKey: CHAT_MODELS_KEY });
    }
  } catch {
    // The last good list stands.
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
  return cachedModels(queryClient);
}
