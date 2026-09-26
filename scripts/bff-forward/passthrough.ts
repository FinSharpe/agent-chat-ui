/**
 * The LangGraph passthrough (`src/app/api/[..._path]/route.ts`) sends the
 * runtime only the browser headers on the allow-list, and credentials only
 * this server sets (finsharpe-agents whole-system review of 2026-09-26,
 * findings 1 and 4).
 *
 * What it guards: the route adds the deployment's LangSmith key as
 * `X-Api-Key`. A browser header `x-auth-scheme: langsmith` copied beside it
 * makes the runtime authenticate the key instead of the app's JWT, and the
 * caller runs as a LangSmith Studio user — no account, so never admitted,
 * gated, capped or charged. And a forged token with no `exp` must not ride
 * upstream as a live session.
 *
 * The real route handler runs over a recorded `fetch`.
 */
import {
  LANGGRAPH,
  SERVER_KEY,
  answerWith,
  browserRequest,
  eq,
  finish,
  liveToken,
  recorded,
  token,
} from "./support/server";

import { GET, POST } from "@/app/api/[..._path]/route";

const ALLOWED = {
  "content-type": "application/json",
  accept: "text/event-stream",
  "last-event-id": "1712345678901-0",
  "x-app-version": "1.4.0",
  "x-app-platform": "web",
};

/** Headers a browser can send that must never reach the runtime from it. */
const HOSTILE = {
  "x-auth-scheme": "langsmith",
  "x-api-key": "lsv2_browser_chosen_key",
  authorization: "Bearer browser.chosen.token",
  "x-fgp": "browser-chosen-fingerprint",
  "x-tenant-id": "tenant-from-browser",
  "x-service-key": "service-key-from-browser",
  "x-user-id": "someone-else",
  "x-langsmith-anything": "1",
  "x-auth-client-ip": "203.0.113.9",
  "x-auth-proxy-key": "guessed",
  "langsmith-trace": "20260926T000000000000Zabc",
  baggage: "langsmith-project=someone-elses-project",
  traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
  "x-request-id": "chosen-request-id",
  prefer: "return=minimal",
  "user-agent": "curl/8.0",
  origin: "http://evil.test",
  referer: "http://evil.test/page",
  "x-forwarded-for": "198.51.100.7",
  "accept-encoding": "gzip, br, zstd",
};

async function main() {
  // --- a live session sending everything ----------------------------------
  const session = liveToken();
  answerWith();
  const res = await POST(
    browserRequest("/api/threads/t-1/runs/stream?stream_mode=values", {
      method: "POST",
      cookies: {
        access_token: session,
        refresh_token: "r-1",
        fgp: "fingerprint-1",
      },
      headers: { ...ALLOWED, ...HOSTILE },
      body: '{"assistant_id":"orchestrator"}',
    }),
  );
  const [upstream] = recorded();
  eq(recorded().length, 1, "one request goes upstream");
  eq(
    upstream?.url,
    `${LANGGRAPH}/threads/t-1/runs/stream?stream_mode=values`,
    "to the runtime's path, with the query",
  );
  eq(upstream?.method, "POST", "with the browser's method");
  eq(upstream?.body, '{"assistant_id":"orchestrator"}', "and its body");
  eq(
    Object.keys(upstream?.headers ?? {}).sort(),
    [
      "accept",
      "authorization",
      "content-type",
      "last-event-id",
      "x-api-key",
      "x-app-platform",
      "x-app-version",
      "x-fgp",
    ],
    "only the allow-list and this server's credentials go upstream",
  );
  eq(
    upstream?.headers["x-auth-scheme"],
    undefined,
    "a browser's x-auth-scheme never reaches the runtime",
  );
  eq(
    upstream?.headers.authorization,
    `Bearer ${session}`,
    "the Bearer is the session cookie's token, not the browser's header",
  );
  eq(
    upstream?.headers["x-api-key"],
    SERVER_KEY,
    "X-Api-Key is this server's, not the browser's",
  );
  eq(
    upstream?.headers["x-fgp"],
    "fingerprint-1",
    "X-Fgp is the fingerprint cookie's, not the browser's header",
  );
  eq(
    Object.fromEntries(
      Object.keys(ALLOWED).map((name) => [name, upstream?.headers[name]]),
    ),
    ALLOWED,
    "each allow-listed header arrives as the browser sent it",
  );
  eq(res.status, 200, "the runtime's answer comes back");

  // --- the finding's own case: a signed-in user adds only the header ------
  answerWith();
  await POST(
    browserRequest("/api/threads/t-1/runs/stream", {
      method: "POST",
      cookies: { access_token: session, fgp: "fingerprint-1" },
      headers: {
        "content-type": "application/json",
        "x-auth-scheme": "langsmith",
      },
      body: "{}",
    }),
  );
  eq(
    recorded().map((r) => [
      r.headers["x-auth-scheme"],
      r.headers.authorization,
    ]),
    [[undefined, `Bearer ${session}`]],
    "a signed-in user's added x-auth-scheme is dropped; the JWT authenticates",
  );

  // --- no fingerprint cookie: the browser cannot supply one ---------------
  answerWith();
  await GET(
    browserRequest("/api/threads/t-1/state", {
      cookies: { access_token: session },
      headers: { "x-fgp": "browser-chosen-fingerprint" },
    }),
  );
  eq(
    recorded().map((r) => r.headers["x-fgp"]),
    [undefined],
    "with no fingerprint cookie, no X-Fgp goes upstream",
  );

  // --- a stream resumed after a dropped connection ------------------------
  answerWith();
  await GET(
    browserRequest("/api/threads/t-1/runs/r-1/stream", {
      cookies: { access_token: session, fgp: "fingerprint-1" },
      headers: {
        "last-event-id": "1712345678901-3",
        accept: "text/event-stream",
      },
    }),
  );
  eq(
    recorded().map((r) => [r.method, r.headers["last-event-id"], r.body]),
    [["GET", "1712345678901-3", null]],
    "a join carries Last-Event-ID, and a GET no body",
  );

  // --- a forged token with no exp, and no refresh token -------------------
  answerWith();
  const forged = await POST(
    browserRequest("/api/threads/t-1/runs/stream", {
      method: "POST",
      cookies: { access_token: "x.e30.y" },
      headers: {
        "content-type": "application/json",
        "x-auth-scheme": "langsmith",
      },
      body: "{}",
    }),
  );
  eq(
    forged.status,
    401,
    "an exp-less forged token with no refresh token is 401",
  );
  eq(recorded().length, 0, "and nothing is sent anywhere");

  // --- the same forged token beside a refresh token the backend refuses ---
  answerWith((url) =>
    url.endsWith("/auth/refresh")
      ? new Response('{"detail":"Invalid refresh token"}', { status: 401 })
      : new Response("{}", { status: 200 }),
  );
  const refused = await POST(
    browserRequest("/api/threads/t-1/runs/stream", {
      method: "POST",
      cookies: {
        access_token: token({ sub: "anyone" }),
        refresh_token: "made-up",
      },
      headers: {
        "content-type": "application/json",
        "x-auth-scheme": "langsmith",
      },
      body: "{}",
    }),
  );
  eq(
    recorded().map((r) => r.url),
    [`${LANGGRAPH}/auth/refresh`],
    "an exp-less token is refreshed first, and never sent to the runtime",
  );
  eq(refused.status, 401, "a refused refresh is 401");

  finish();
}

void main();
