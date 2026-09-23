import { cn } from "@/lib/utils";

// The sections arrive as markdown rendered by the shared MarkdownText, whose
// defaults are sized for the PDF reports (3xl semibold headings). Inside a
// chat card they are brought down to the answer scale from here, so the PDF
// look is untouched. Colours come from the wrapper's navy (which the dark
// theme remaps) or from theme variables, never from literal light-only
// values on descendants, which the dark overrides cannot reach.
export const ANALYSIS_PROSE = cn(
  "text-[13px] leading-relaxed text-[#0A1F4D]",
  "[&_h2]:font-geist [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-medium [&_h2]:tracking-normal",
  "[&_h3]:font-geist [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:tracking-normal",
  "[&_h4]:font-geist [&_h4]:mb-2 [&_h4]:text-sm [&_h4]:font-medium [&_h4]:tracking-normal",
  "[&_p]:my-3 [&_p]:leading-relaxed",
  "[&_li]:marker:text-[var(--tone-blue-fg)]",
  "[&_hr]:my-4 [&_hr]:border-[var(--card-border)]",
  // markdown-styles.css draws the <details> border unlayered, so only an
  // important utility can recolour it.
  "[&_details]:rounded-nested [&_details]:border-[var(--card-border)]! [&_details]:bg-[#0A1F4D]/[0.03]",
  "[&_summary]:text-[11px] [&_summary]:hover:bg-[#063BAA]/6",
);
