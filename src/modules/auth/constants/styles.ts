/**
 * Class strings shared by the auth screens, copied from the reference
 * screens (finsharpegpt-desktop-web `components/auth/*`) so every screen draws
 * its pills, inputs and labels the same way.
 */

export const PRIMARY_BUTTON_CLASS =
  "w-full bg-brand-gradient text-white py-4 px-6 rounded-full font-medium text-sm tracking-wide uppercase hover:brightness-110 transition-all shadow-md shadow-blue-900/10 active:scale-98 whitespace-nowrap disabled:opacity-70 disabled:cursor-wait";

// The dark: classes are ours, not the reference's: its auth screens have no
// dark styling, and the navy outline and placeholders vanish on the dark canvas.
export const OUTLINE_BUTTON_CLASS =
  "w-full bg-white border border-[#063BAA]/30 dark:border-white/15 text-[#063BAA] py-4 px-6 rounded-full font-medium text-sm tracking-wide uppercase hover-tint transition-all active:scale-98";

export const INPUT_CLASS =
  "w-full glass-tile rounded-full px-4 py-3 text-sm text-[#0A1F4D] focus:outline-none focus:border-[#063BAA]/45 placeholder-[#0A1F4D]/50 dark:placeholder-white/35";

export const LABEL_CLASS =
  "text-xs uppercase tracking-wider text-[#0A1F4D] font-medium block";

export const LINK_TEXT_CLASS = "text-[#063BAA] font-medium";

/** Where "Forgot?" goes: there is no self-serve reset yet, support resets. */
export const SUPPORT_EMAIL = "info@finsharpe.com";
export const FORGOT_PASSWORD_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Reset my FinSharpeGPT password")}`;

export const PRIVACY_URL = "https://finsharpe.com/privacy-policy";
