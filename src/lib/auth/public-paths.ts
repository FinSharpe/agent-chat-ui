/**
 * Which paths are reachable without a session.
 *
 * One list, two readers: the middleware, which decides whether a request gets
 * bounced to `/login`, and the client-side 401 interceptor in `AuthProvider`,
 * which decides whether a failed `/api/*` call means the session died. They had
 * drifted — the interceptor knew only about the three auth screens — so a
 * logged-out visitor on any other public page was redirected to `/login` the
 * moment `/api/auth/me` came back 401. That is every reader of a shared report.
 */

/** Exact page paths served without a session. */
export const PUBLIC_PAGE_PATHS = [
  "/login",
  "/register",
  "/verify-email",
  "/welcome",
];

/** Page path prefixes served without a session. */
export const PUBLIC_PAGE_PREFIXES = [
  "/moneyone/",
  // Mobile App Link return + Android verification file: fetched with no web
  // session (Custom Tab / Google crawler) — must never bounce to /login.
  "/app/consent-return",
  // Shared research reports: the backend serves these to whoever holds the
  // token, by decision (ADR-0010 / Pipelines Phase 3).
  "/shared/",
];

/** Non-page request prefixes the middleware must never gate. */
export const PUBLIC_REQUEST_PREFIXES = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/.well-known/",
];

/** A page a visitor may legitimately be on with no session. */
export function isPublicPage(pathname: string): boolean {
  if (PUBLIC_PAGE_PATHS.includes(pathname)) return true;
  return PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Everything the middleware lets through, pages and assets alike. */
export function isPublicPath(pathname: string): boolean {
  if (isPublicPage(pathname)) return true;
  return PUBLIC_REQUEST_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
