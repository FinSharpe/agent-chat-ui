"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useUiStore } from "@/store/useUiStore";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";
import { getInitials } from "../utils/initials";

/**
 * Everything the shell's identity surfaces need, in one place, so the desktop
 * sidebar footer and the mobile header menu behave identically (T-02).
 *
 * There is no Account Settings screen any more: the only two real destinations
 * it used to host — MCP Access and Delete Account — are plain rows here.
 */
export function useAccountActions() {
  const router = useRouter();
  const { user, isLoading, status, logout } = useAuth();
  const themeMode = useUiStore((s) => s.themeMode);
  const toggleThemeMode = useUiStore((s) => s.toggleThemeMode);
  const setThemeMode = useUiStore((s) => s.setThemeMode);
  const setProfileSettingsOpen = useUiStore((s) => s.setProfileSettingsOpen);

  const name = user?.name?.trim() || "";
  // A session we cannot name is still a session; "signed in" follows the
  // user object, never the name, so an unnamed account keeps its menu.
  const signedIn = !!user;
  // Only the /auth/me answer carries an email; the user_info cookie does not.
  const email = user && "email" in user ? user.email : null;

  const openProfile = useCallback(
    () => setProfileSettingsOpen(true),
    [setProfileSettingsOpen],
  );
  const openMcpAccess = useCallback(
    () => router.push("/settings/mcp"),
    [router],
  );
  const openDeleteAccount = useCallback(
    () => router.push("/delete-account"),
    [router],
  );
  const openLogin = useCallback(() => router.push(AUTH_ROUTES.login), [router]);

  return {
    name,
    email,
    signedIn,
    /**
     * We have no identity *and* no answer — /api/auth/me is still out, or it
     * could not be reached at all. The footer then shows a quiet placeholder:
     * never the name (we don't have one), and never a Login button either,
     * which would present an unreachable server as a signed-out session
     * (T-01 item 3 / T-10). Only a real 401 turns into Login.
     */
    isResolving: !user && (isLoading || status === "unreachable"),
    initials: name ? getInitials(name) : null,
    themeMode,
    toggleThemeMode,
    setThemeMode,
    openProfile,
    openMcpAccess,
    openDeleteAccount,
    openLogin,
    logout,
  };
}
