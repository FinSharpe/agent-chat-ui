"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserResponse } from "@/api/generated/auth-apis/models";
import { isPublicPage } from "@/lib/auth/public-paths";

/**
 * Minimal user data available from the user_info cookie.
 * Cookie only has id, name, roles (PII stripped in setAuthCookies — see cookies.ts line 43).
 * IMPORTANT: this must stay in sync with the fields written to user_info cookie.
 * If email is ever added to the cookie, isHydratedUser must be updated.
 */
export type CookieUser = Pick<UserResponse, "id" | "name" | "roles">;

/**
 * Type guard: narrows CookieUser | UserResponse to UserResponse.
 * Works because email is required in UserResponse but absent from CookieUser (Pick excludes it).
 */
export function isHydratedUser(user: CookieUser | UserResponse): user is UserResponse {
  return "email" in user;
}

interface AuthContextType {
  user: CookieUser | UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateUser: (user: CookieUser | UserResponse) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function getUserFromCookie(): CookieUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)user_info=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CookieUser | UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Global 401 interceptor — redirect to /login when any /api/* call
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
        window.location.href = "/login";
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Hydrate user from cookie, then enrich from /api/auth/me.
  // On auth failure (401) clear user; on server errors keep cookie user
  // so the avatar and logout button remain accessible.
  useEffect(() => {
    const cookieUser = getUserFromCookie();
    if (cookieUser) setUser(cookieUser);

    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) setUser(null);
        // On non-401 errors (e.g. 500), keep cookieUser as-is
        return null;
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {
        // Network error — keep cookieUser so logout remains available
      })
      .finally(() => setIsLoading(false));
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.user) setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refreshAuth,
        updateUser: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
