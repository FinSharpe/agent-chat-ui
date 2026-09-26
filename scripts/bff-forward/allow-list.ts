/**
 * The rule behind the LangGraph passthrough, held for the whole app: nothing
 * a browser sends chooses how, or as whom, this server's requests
 * authenticate upstream (finsharpe-agents whole-system review of 2026-09-26,
 * findings 1 and 4).
 *
 * - The allow-list names no credential and no header that selects an
 *   authentication scheme or an identity.
 * - `upstreamHeaders` sets the credentials from this server's values only.
 * - No module under `src/` builds an upstream request from the browser's
 *   whole header set.
 * - The modules that read the deployment's LangSmith key are the ones audited
 *   on 2026-09-26. A new one fails this check until someone has looked at
 *   what it forwards beside the key.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { eq, finish } from "./support/server";

import {
  FORWARDED_REQUEST_HEADERS,
  upstreamHeaders,
} from "@/lib/auth/forwarded-headers";

// --- the list itself --------------------------------------------------------

/** Credentials, identities and auth selectors a browser must never supply. */
const NEVER_FROM_THE_BROWSER = [
  "authorization",
  "proxy-authorization",
  "cookie",
  "host",
  "x-api-key",
  "x-fgp",
  "x-auth-scheme",
  "x-tenant-id",
  "x-service-key",
  "x-user-id",
  "x-refresh-token",
  "x-run-completion-key",
  "x-call-record-key",
  "langsmith-trace",
  "baggage",
];
const NEVER_PREFIXES = ["x-auth", "x-langsmith", "langsmith", "x-langgraph"];

eq(
  FORWARDED_REQUEST_HEADERS.filter(
    (name) =>
      NEVER_FROM_THE_BROWSER.includes(name) ||
      NEVER_PREFIXES.some((prefix) => name.startsWith(prefix)),
  ),
  [],
  "the allow-list names no credential, identity or auth selector",
);
eq(
  FORWARDED_REQUEST_HEADERS.every((name) => name === name.toLowerCase()),
  true,
  "the allow-list is lower case, as Headers reports names",
);

// --- upstreamHeaders --------------------------------------------------------

const hostile = new Headers({
  "X-Auth-Scheme": "langsmith",
  "X-API-KEY": "browser-key",
  Authorization: "Bearer browser",
  "X-Fgp": "browser-fgp",
  "Content-Type": "application/json",
});

const withoutServerKey = upstreamHeaders(hostile, { accessToken: "session" });
eq(
  [...withoutServerKey.keys()].sort(),
  ["authorization", "content-type"],
  "with no server key and no fingerprint: the Bearer and the allow-list only",
);
eq(
  withoutServerKey.get("x-api-key"),
  null,
  "a server with no LangSmith key sends none, whatever the browser sent",
);
eq(
  withoutServerKey.get("authorization"),
  "Bearer session",
  "the Bearer is the session's",
);

const withServerKey = upstreamHeaders(hostile, {
  accessToken: "session",
  fingerprint: "cookie-fgp",
  apiKey: "server-key",
});
eq(
  [
    withServerKey.get("x-auth-scheme"),
    withServerKey.get("x-api-key"),
    withServerKey.get("x-fgp"),
  ],
  [null, "server-key", "cookie-fgp"],
  "mixed-case browser names are dropped, and the server's values set",
);

// --- no module copies the browser's headers ---------------------------------

const SRC = join(process.cwd(), "src");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [path] : [];
  });
}

const files = sources(SRC).map((path) => ({
  name: relative(process.cwd(), path).split("\\").join("/"),
  text: readFileSync(path, "utf8"),
}));
eq(files.length > 100, true, "the scan sees the app's sources");

const REQUEST = String.raw`\b(?:request|req)\.headers\b`;
const COPIES = [
  new RegExp(String.raw`new Headers\(\s*` + REQUEST),
  new RegExp(String.raw`headers\s*:\s*` + REQUEST + String.raw`\s*[,}]`),
  new RegExp(String.raw`\.\.\.\s*` + REQUEST),
  new RegExp(String.raw`Object\.fromEntries\(\s*` + REQUEST),
  new RegExp(REQUEST + String.raw`\.(?:forEach|entries)\(`),
];
eq(
  files
    .filter(({ text }) => COPIES.some((pattern) => pattern.test(text)))
    .map(({ name }) => name),
  [],
  "no module builds an upstream request from the browser's whole header set",
);

// --- who reads the deployment's LangSmith key -------------------------------

/**
 * Each was read on 2026-09-26. None forwards a browser header beside the key
 * but through an allow-list: the passthrough uses `upstreamHeaders`; the
 * utilities proxy forwards `content-type` alone; the share proxy and the
 * three report pages forward nothing of the browser's; `Stream.tsx` runs in
 * the browser, where the variable is not defined.
 */
const READS_THE_KEY = [
  "src/app/api/[..._path]/route.ts",
  "src/app/api/download-message/mf-analysis-report/page.tsx",
  "src/app/api/download-message/pf-analysis-report/page.tsx",
  "src/app/api/download-message/stock-analysis-report/page.tsx",
  "src/app/api/shared/[..._slug]/route.ts",
  "src/app/api/utilities/[..._slug]/route.ts",
  "src/providers/Stream.tsx",
];
eq(
  files
    .filter(({ text }) => /LANGSMITH_API_KEY/.test(text))
    .map(({ name }) => name)
    .sort(),
  READS_THE_KEY,
  "the modules reading LANGSMITH_API_KEY are the audited ones",
);

finish();
