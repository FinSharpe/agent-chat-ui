/**
 * Where an auth screen sends the user once they are signed in.
 *
 * A visitor can reach `/login` from a page that wants them back afterwards —
 * `/delete-account` above all, which is useless to someone who lands on the
 * chat home instead. The page asks for that with `?next=`, and this decides
 * whether the ask is one we are willing to honour.
 *
 * Only a same-origin path qualifies. `//evil.com` and `/\evil.com` are read as
 * protocol-relative URLs by browsers, and an absolute URL is somebody else's
 * origin, so all of them fall back rather than turning `/login` into an open
 * redirect anyone can point at a phishing page.
 */
export function safeReturnPath(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
