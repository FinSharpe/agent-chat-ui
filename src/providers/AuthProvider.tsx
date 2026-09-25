"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UserResponse } from "@/api/generated/auth-apis/models";
import { isPublicPage } from "@/lib/auth/public-paths";
import { readUserInfoCookie, writeUserInfoCookie } from "@/lib/auth/user-info";
import { clearBrowserCopies } from "@/lib/browser-copies";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";

/**
 * Minimal user data available from the user_info cookie.
 * Cookie only has id, name, roles (PII stripped in setAuthCookies — see cookies.ts).
 * IMPORTANT: this must stay in sync with the fields written to user_info cookie.
 * If email is ever added to the cookie, isHydratedUser must be updated.
 */
export type CookieUser = Pick<UserResponse, "id" | "name" | "roles">;

/**
 * Three outcomes, not two — "we don't know" is not the same as "signed out".
 * - `authenticated` — /api/auth/me answered 200.
 * - `signed-out`    — it answered 401; the session is genuinely dead.
 * - `unreachable`   — network error or 5xx. Whatever the cookie said is still
 *   the best guess, and the shell says so rather than presenting a
 *   signed-out UI or bouncing to /login (T-01 item 3, T-10 item 4).
 */
export type AuthStatus =
  | "loading"
  | "authenticated"
  | "signed-out"
  | "unreachable";

type MeResult =
  | { kind: "ok"; user: UserResponse }
  | { kind: "unauthorized" }
  | { kind: "unreachable" };

async function fetchMe(): Promise<MeResult> {
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json().catch(() => null);
      // A 200 with an unreadable body means the proxy answered, not the
      // backend — treat it as "can't reach", never as "signed out".
      return data && typeof data === "object"
        ? { kind: "ok", user: data as UserResponse }
        : { kind: "unreachable" };
    }
    if (res.status === 401) return { kind: "unauthorized" };
    return { kind: "unreachable" };
  } catch {
    return { kind: "unreachable" };
  }
}

const RETRY_DELAY_MS = 1200;

/**
 * Type guard: narrows CookieUser | UserResponse to UserResponse.
 * Works because email is required in UserResponse but absent from CookieUser (Pick excludes it).
 */
export function isHydratedUser(
  user: CookieUser | UserResponse,
): user is UserResponse {
  return "email" in user;
}

interface AuthContextType {
  user: CookieUser | UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** See AuthStatus — `unreachable` is neither signed in nor signed out. */
  status: AuthStatus;
  /** True while the session state is unknown because the server can't be reached. */
  authError: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  /** Re-ask /api/auth/me; lets the shell's banner recover without a reload. */
  retryAuth: () => Promise<void>;
  updateUser: (user: CookieUser | UserResponse) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CookieUser | UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<AuthStatus>("loading");
  // Guards the hydration effect against a retry landing after unmount.
  const mounted = useRef(true);

  // Global 401 interceptor — redirect to Sign In when any /api/* call
  // returns 401, except auth endpoints where 401 is an expected input
  // error (wrong password, bad OTP, etc.). At this point the server-side
  // fetchWithRefresh has already attempted a token refresh, so 401
  // means the session is truly dead.
  //
  // useLayoutEffect so the patch is installed synchronously before
  // children's useEffect callbacks (which may already fire API calls).
  useLayoutEffect(() => {
    const originalFetch = window.fetch;
    let isRedirecting = false;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      const input = args[0];
      // Resolve to a pathname so both relative ("/api/info") and
      // absolute ("http://localhost:3000/api/info") URLs are matched.
      let pathname = "";
      try {
        if (typeof input === "string" || input instanceof URL) {
          pathname = new URL(input, window.location.origin).pathname;
        } else if (input instanceof Request) {
          pathname = new URL(input.url).pathname;
        }
      } catch {
        // Malformed URL — leave pathname empty, skip redirect logic.
      }
      // Auth endpoints where 401 is expected (bad input or own error handling).
      const AUTH_401_PASSTHROUGH = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/verify-email",
        "/api/auth/refresh",
        "/api/auth/resend-otp",
        "/api/auth/logout",
        "/api/auth/logout-all",
      ];
      // Any page a visitor may legitimately be on with no session — the auth
      // screens, and every other public page (a shared report above all). On
      // those, a 401 is the expected answer for an anonymous reader, not a
      // dead session, and bouncing them to /login would break the page.
      const onPublicPage = isPublicPage(window.location.pathname);
      if (
        !isRedirecting &&
        !onPublicPage &&
        response.status === 401 &&
        pathname.startsWith("/api/") &&
        !AUTH_401_PASSTHROUGH.includes(pathname)
      ) {
        isRedirecting = true;
        // The session died under a signed-in visitor, so skip the Welcome
        // screen a stranger gets: straight to Sign In, and back here after.
        const here = window.location.pathname + window.location.search;
        window.location.href =
          here === "/"
            ? AUTH_ROUTES.login
            : `${AUTH_ROUTES.login}?next=${encodeURIComponent(here)}`;
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Applies one /api/auth/me outcome. Shared by the first hydration and by
  // the banner's Retry, so both settle into the same three states.
  const applyMeResult = useCallback((result: MeResult) => {
    if (result.kind === "ok") {
      setUser(result.user);
      // Keep the first-paint cookie in step with the server's answer, so a
      // renamed profile — or a session whose cookie predates T-01's lifetime
      // fix — shows the right name on the next load with no re-login.
      writeUserInfoCookie(result.user);
      setStatus("authenticated");
      return;
    }
    if (result.kind === "unauthorized") {
      setUser(null);
      setStatus("signed-out");
      return;
    }
    // Unreachable: hold on to whatever the cookie gave us. The shell shows a
    // "can't reach the server" banner instead of a signed-out UI.
    setStatus("unreachable");
  }, []);

  // Hydrate from the cookie for the first paint, then confirm with
  // /api/auth/me — retried once, because a single failed request is far more
  // often a blip than a dead session.
  useEffect(() => {
    mounted.current = true;
    const cookieUser = readUserInfoCookie();
    if (cookieUser) setUser(cookieUser);

    (async () => {
      let result = await fetchMe();
      if (result.kind === "unreachable") {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        if (!mounted.current) return;
        result = await fetchMe();
      }
      if (!mounted.current) return;
      applyMeResult(result);
      setIsLoading(false);
    })();

    return () => {
      mounted.current = false;
    };
  }, [applyMeResult]);

  const retryAuth = useCallback(async () => {
    setStatus("loading");
    applyMeResult(await fetchMe());
  }, [applyMeResult]);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setStatus("authenticated");
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // A screen that has just signed in (login, OTP) hands us the full user; the
  // route handler has already written the cookies, so this is only state.
  const updateUser = useCallback((next: CookieUser | UserResponse) => {
    setUser(next);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // What this browser kept about the user's connections goes whatever
      // the request did — the copy of connected financial data and the old
      // consent records — so a sign-out that fails part-way leaves none.
      await clearBrowserCopies();
    }
    setUser(null);
    setStatus("signed-out");
    // Signing out returns to the Welcome screen, as in the reference flow.
    window.location.href = AUTH_ROUTES.welcome;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        status,
        authError: status === "unreachable",
        logout,
        refreshAuth,
        retryAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
