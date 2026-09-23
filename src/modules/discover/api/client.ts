/**
 * How Discover's public market feeds reach the backend.
 *
 * finsharpe-agents serves them at `/api/news/market`, `/api/ipo/issues` and
 * `/api/ipo/insights/{fincode}` — the same paths finsharpe-mobile calls. This
 * app never talks to that host directly: `src/app/api/utilities/[..._slug]`
 * forwards `/api/utilities/<path>` to `<backend>/api/<path>` (and injects the
 * session), which is why every generated client's URL begins
 * `/api/utilities/`. So the backend's `/api/news/market` is reached here as
 * `/api/utilities/news/market`.
 *
 * The other passthrough, `src/app/api/[..._path]`, strips the `/api` prefix
 * instead and is for the LangGraph routes — it cannot reach these.
 */

/** A backend path (`ipo/issues`) as this app's URL for it. */
export const backendPath = (path: string) =>
  `/api/utilities/${path.replace(/^\/+/, "")}`;

/**
 * A feed that did not answer.
 *
 * The backend returns `{"detail": {"reason", "message"}}` on 502/503 with
 * reasons like `upstream_unreachable`. The reason is for the console; the
 * screens show their own one sentence, because a rotated credential and a
 * vendor outage are the same event to a reader.
 */
export class FeedError extends Error {
  constructor(
    readonly reason: string,
    readonly status?: number,
  ) {
    super(`${reason}${status ? ` (HTTP ${status})` : ""}`);
    this.name = "FeedError";
  }
}

/** GET a JSON body, or throw a {@link FeedError}. `refresh` bypasses the backend's ~15-minute cache. */
export async function getJson<T>(
  path: string,
  { signal, refresh = false }: { signal?: AbortSignal; refresh?: boolean } = {},
): Promise<T> {
  const url = backendPath(path) + (refresh ? "?refresh=true" : "");

  let response: Response;
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    // An aborted query is react-query cancelling, not a feed failure.
    if (signal?.aborted) throw error;
    throw new FeedError("network_unreachable");
  }

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail = (body as { detail?: unknown } | null)?.detail;
    const reason =
      typeof detail === "object" && detail !== null && "reason" in detail
        ? String((detail as { reason: unknown }).reason)
        : "unknown";
    throw new FeedError(reason, response.status);
  }
  if (body === null) throw new FeedError("upstream_malformed", response.status);
  return body as T;
}
