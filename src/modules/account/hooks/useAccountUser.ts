"use client";

import { useCallback, useState } from "react";
import { isHydratedUser, useAuth } from "@/providers/AuthProvider";
// Imported from the util directly, not "@/modules/shell": the shell's index
// re-exports AppShell, which imports these overlays — a cycle.
import { getInitials } from "@/modules/shell/utils/initials";

/**
 * The signed-in user as the account screens show them, plus sign-out.
 *
 * Email is only known once /auth/me has answered — the user_info cookie the
 * first render sees carries no PII — so it is null until then.
 */
export function useAccountUser() {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const name = user?.name?.trim() || "";
  const email = user && isHydratedUser(user) ? user.email : null;

  const signOut = useCallback(() => {
    if (signingOut) return;
    setSigningOut(true);
    // logout() leaves for /login on success; only a failed request lands
    // back here, and then the button must work again.
    logout().catch(() => setSigningOut(false));
  }, [logout, signingOut]);

  return {
    name,
    email,
    roles: user?.roles ?? [],
    // Null until a name is known; the avatars then show a person icon, as
    // the shell's header avatar does.
    initials: name ? getInitials(name) : null,
    signOut,
    signingOut,
  };
}
