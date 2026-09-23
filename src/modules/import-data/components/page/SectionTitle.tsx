import type { ReactNode } from "react";

/** Small uppercase section label — the reference Import screen's `Section`. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="block pl-1 text-xs font-medium tracking-wider text-black uppercase dark:text-white">
      {children}
    </h3>
  );
}

/** Row label used above the Smart Alerts rows (News, Technical, …). */
export function RowLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block pl-1 text-xs font-medium tracking-wider text-black uppercase dark:text-white">
      {children}
    </span>
  );
}
