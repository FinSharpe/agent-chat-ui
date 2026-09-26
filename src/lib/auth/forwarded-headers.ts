/**
 * What the LangGraph passthrough (`src/app/api/[..._path]/route.ts`) sends
 * upstream: the few browser headers named below, and credentials only this
 * server sets. Every other header a browser sends stops here.
 *
 * It is an allow-list, never a copy of the browser's headers, because the
 * runtime takes its authentication scheme from a request header. With
 * `x-auth-scheme: langsmith` it judges `X-Api-Key` — which this server fills
 * with the deployment's LangSmith workspace key — instead of the app's JWT,
 * and the caller runs as a LangSmith Studio user. That user is no account, so
 * the agents admit nothing, gate nothing and cap nothing, and every model call
 * is Company Expense (finsharpe-agents whole-system review of 2026-09-26,
 * findings 1 and 4). A deny-list would have to know every header the runtime
 * will ever give a meaning to: it also copies each `x-*` header into a run's
 * config, and reads `langsmith-trace` and `baggage` for tracing.
 *
 * The list, and what each header is for:
 * - `content-type`: the JSON bodies of thread, run and search requests.
 * - `accept`: content negotiation; the SDK asks `/ui/{assistant}` for HTML.
 * - `last-event-id`: resuming a run or thread stream. The runtime's join
 *   routes read it, and the SDK sends it from 1.x.
 * - `x-app-version`, `x-app-platform`: the runtime's access log records them
 *   (finsharpe-agents `langgraph.json`, `http.logging_headers`). Nothing else
 *   reads them.
 *
 * Adding a header here is a security decision. It must carry no credential
 * and must say nothing about who the caller is or how to authenticate them.
 * `pnpm check:bff-forward` refuses the ones that do.
 */
export const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type",
  "last-event-id",
  "x-app-platform",
  "x-app-version",
] as const;

export interface UpstreamCredentials {
  /** The session's access token, sent as the Bearer. */
  accessToken: string;
  /** The fingerprint cookie's value, bound to the token (`X-Fgp`). */
  fingerprint?: string;
  /** The deployment's LangSmith key, if this server has one (`X-Api-Key`). */
  apiKey?: string;
}

/** The headers for one upstream request to the LangGraph runtime. */
export function upstreamHeaders(
  browser: Headers,
  credentials: UpstreamCredentials,
): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = browser.get(name);
    if (value !== null) headers.set(name, value);
  }
  headers.set("Authorization", `Bearer ${credentials.accessToken}`);
  if (credentials.fingerprint) headers.set("X-Fgp", credentials.fingerprint);
  if (credentials.apiKey) headers.set("X-Api-Key", credentials.apiKey);
  return headers;
}
