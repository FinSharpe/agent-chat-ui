"use client";

import { Suspense, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AUTH_ROUTES } from "../../constants/routes";
import AuthChoiceScreen from "../screens/AuthChoiceScreen";
import LoginScreen from "../screens/LoginScreen";
import OtpScreen from "../screens/OtpScreen";
import SignUpScreen from "../screens/SignUpScreen";
import WelcomeScreen from "../screens/WelcomeScreen";

// Each auth route's screen. The layout renders them, not the route pages:
// by the time a route's page renders, the router has already swapped the old
// page out, so the outgoing screen could not animate. Rendered from here, the
// outgoing screen is ours to keep on screen until its exit has played.
const SCREENS: Record<string, ComponentType> = {
  [AUTH_ROUTES.welcome]: WelcomeScreen,
  [AUTH_ROUTES.choice]: AuthChoiceScreen,
  [AUTH_ROUTES.login]: LoginScreen,
  [AUTH_ROUTES.register]: SignUpScreen,
  [AUTH_ROUTES.verifyEmail]: OtpScreen,
};

/**
 * The reference's screen orchestrator transition: the outgoing screen fades
 * and shrinks a touch, then the next one grows in. Keyed by route, so every
 * screen change animates and query-string changes (`?next=`, `?email=`) do
 * not. A route with no screen here falls back to its own page (`children`).
 */
export function AuthScreenTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const pathname = usePathname();
  const Screen = SCREENS[pathname];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className={className}
      >
        {Screen ? (
          // The screens read search params, which need a boundary above them.
          <Suspense fallback={null}>
            <Screen />
          </Suspense>
        ) : (
          children
        )}
      </motion.div>
    </AnimatePresence>
  );
}
