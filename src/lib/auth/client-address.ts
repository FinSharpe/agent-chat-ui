import "server-only";

/**
 * Tell the backend which browser an auth request is for (finsharpe-agents#205).
 *
 * This server calls the backend's `/auth/*` routes itself, so without these
 * headers every web user reaches the backend's per-address rate limits as this
 * server's own egress address — and one person's burst of wrong passwords would
 * lock everyone else out with them. The backend believes `X-Auth-Client-IP` only
 * beside `X-Auth-Proxy-Key` equal to its `AUTH_PROXY_KEY`; unset here, nothing
 * is sent and this server is counted as the client, as before.
 *
 * The browser's address is whatever the hosting edge in front of this app put on
 * the request: `x-real-ip`, else the first `x-forwarded-for` entry. Both are
 * only as trustworthy as that edge. One that passes a client-supplied chain
 * through lets a browser pick its own bucket — which weakens the per-address
 * limits, never the per-email ones.
 */
export function clientAddressHeaders(request: Request): Record<string, string> {
  const key = process.env.AUTH_PROXY_KEY;
  if (!key) return {};

  const address =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!address) return {};

  return { "X-Auth-Proxy-Key": key, "X-Auth-Client-IP": address };
}
