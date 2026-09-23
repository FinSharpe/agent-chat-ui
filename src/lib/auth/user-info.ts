/**
 * The non-httpOnly `user_info` cookie — the only identity the browser can read
 * before `/api/auth/me` answers, so it is what the shell paints the name and
 * avatar from on the very first frame.
 *
 * It carries `{id, name, roles}` and nothing more: PII (email, institutionId)
 * stays behind the httpOnly tokens. Because its job is first-paint hydration
 * for the *whole session*, it lives as long as the refresh token, not as long
 * as the 15-minute access token (T-01) — otherwise a signed-in visitor loses
 * their name mid-session and only gets it back by signing in again.
 *
 * Isomorphic on purpose: the route handlers write it from the server and
 * `AuthProvider` keeps it in sync from the client, so both sides must agree on
 * the name, shape and lifetime.
 */

export const USER_INFO_COOKIE = "user_info";

/**
 * 7 days, matching the refresh token's default lifetime. The server reads
 * `REFRESH_TOKEN_MAX_AGE` on top of this; the client cannot (it is not a
 * `NEXT_PUBLIC_` var) and does not need to — a cookie that outlives the
 * session is harmless, since `clearAuthCookies` removes it on sign-out and a
 * dead session is caught by the 401 interceptor, not by this cookie.
 */
export const DEFAULT_REFRESH_TOKEN_MAX_AGE = 604800;

/**
 * What we are willing to expose to client JavaScript. `name` is nullable
 * because the backend's own user record allows it (UserResponse).
 */
export interface UserInfoCookie {
  id: string;
  name: string | null;
  roles: string[];
}

/** Narrow any user-shaped object down to the three cookie fields. */
export function toUserInfo(user: UserInfoCookie): UserInfoCookie {
  return { id: user.id, name: user.name, roles: user.roles };
}

export function serializeUserInfo(user: UserInfoCookie): string {
  return JSON.stringify(toUserInfo(user));
}

/** Reads the cookie in the browser. Returns null outside it, or if unparseable. */
export function readUserInfoCookie(): UserInfoCookie | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${USER_INFO_COOKIE}=([^;]*)`),
  );
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Re-issues the cookie from the client once `/api/auth/me` has answered, so a
 * renamed profile — or a session whose cookie was written before this fix —
 * paints correctly on the next load without waiting for a new token pair.
 * Never widens the payload: same three fields the server writes.
 */
export function writeUserInfoCookie(user: UserInfoCookie): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(serializeUserInfo(user));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${USER_INFO_COOKIE}=${value}; Path=/; Max-Age=${DEFAULT_REFRESH_TOKEN_MAX_AGE}; SameSite=Lax${secure}`;
}
