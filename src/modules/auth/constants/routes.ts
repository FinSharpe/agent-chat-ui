/**
 * The sign-in flow's screens, one route each so the browser's back button and
 * deep links work. Welcome is where the middleware sends a visitor with no
 * session; every screen carries `?next=` forward so a visitor still lands on
 * the page they first asked for.
 *
 * Pure constants: the middleware imports this file directly (edge runtime), so
 * nothing React may be added here.
 */
export const AUTH_ROUTES = {
  welcome: "/get-started",
  choice: "/get-started/choose",
  login: "/login",
  register: "/register",
  verifyEmail: "/verify-email",
} as const;

/** Length of the email verification code the backend issues. */
export const OTP_LENGTH = 6;

/** Seconds before another verification code may be requested. */
export const RESEND_COOLDOWN_SECONDS = 60;
