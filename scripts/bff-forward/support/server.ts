/**
 * Just enough server for the LangGraph passthrough to run under node: the
 * environment it reads when it loads, a `fetch` that records every request
 * the route makes (to the LangGraph runtime and to the backend's refresh) and
 * answers as each case says, and builders for a browser's request and a
 * session's tokens.
 *
 * Import it before the route: the route reads its environment on load.
 */
import { NextRequest } from "next/server";

export const LANGGRAPH = "http://langgraph.test";
/** The deployment's LangSmith key, which only this server may send. */
export const SERVER_KEY = "lsv2_server_workspace_key";

process.env.LANGGRAPH_API_URL = LANGGRAPH;
process.env.LANGSMITH_API_KEY = SERVER_KEY;
// Plain http: the fingerprint cookie is `fgp`, not `__Secure-Fgp`.
delete process.env.NEXT_PUBLIC_API_URL;
// No forwarded client address on a refresh.
delete process.env.AUTH_PROXY_KEY;

export interface Recorded {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
}

let requests: Recorded[] = [];
let answer: (url: string) => Response = () =>
  new Response('{"ok":true}', {
    status: 200,
    headers: { "content-type": "application/json" },
  });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : String(input);
  const headers: Record<string, string> = {};
  new Headers(init?.headers).forEach((value, name) => {
    headers[name] = value;
  });
  const body =
    init?.body === undefined || init.body === null
      ? null
      : await new Response(init.body).text();
  requests.push({ url, method: init?.method ?? "GET", headers, body });
  return answer(url);
}) as typeof fetch;

/** Starts a case: forgets earlier requests and sets how `fetch` answers. */
export function answerWith(fn?: (url: string) => Response) {
  requests = [];
  if (fn) answer = fn;
}

export function recorded(): Recorded[] {
  return requests;
}

/** A token shaped like the backend's, signed by nobody: the route never checks. */
export function token(payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `eyJhbGciOiJIUzI1NiJ9.${body}.signature`;
}

export function liveToken(): string {
  return token({
    sub: "user-1",
    iss: "finsharpe",
    aud: "finsharpe",
    exp: Math.floor(Date.now() / 1000) + 600,
  });
}

export function browserRequest(
  path: string,
  options: {
    method?: string;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): NextRequest {
  const headers = new Headers(options.headers);
  const cookies = Object.entries(options.cookies ?? {})
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookies) headers.set("cookie", cookies);
  return new NextRequest(new URL(path, "http://app.test"), {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    // Node refuses a request body without it.
    duplex: "half",
  });
}

let failures = 0;
let finished = false;

/**
 * A check reports only through `finish()`. If an awaited request never
 * settles and no timer is left, node would exit 0 without reaching it, so a
 * route that hangs would read as a pass. It fails instead.
 */
process.on("beforeExit", () => {
  if (finished) return;
  console.log(
    "FAIL the check ended before finish(): an awaited promise never settled",
  );
  process.exit(1);
});

export function eq(actual: unknown, expected: unknown, name: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${name}\n  got:      ${a}\n  expected: ${e}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

export function finish() {
  finished = true;
  if (failures > 0) {
    console.log(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nall passed");
  process.exit(0);
}
