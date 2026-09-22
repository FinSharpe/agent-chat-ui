import { Check, Lock } from "lucide-react";
import { SectionTitle } from "./page/SectionTitle";

const DATA_USAGE = [
  "Your data is processed locally and encrypted with bank-level security",
  "We analyze patterns to provide personalized investment recommendations",
  "No data is shared with third parties without your explicit consent",
  "You maintain full control and can disconnect accounts anytime",
];

/** "How We Use Your Data" — the page's closing list of data guarantees. */
export function DataSecurityInfo() {
  return (
    <section className="space-y-1">
      <div className="flex items-center gap-1.5 px-1">
        <Lock
          size={12}
          className="text-slate-400"
        />
        <SectionTitle>How We Use Your Data</SectionTitle>
      </div>
      <ul>
        {DATA_USAGE.map((line) => (
          <li
            key={line}
            className="flex gap-2.5 border-b border-slate-100 py-3 text-[11px] leading-snug text-slate-500 last:border-b-0 dark:border-slate-800/60 dark:text-slate-400"
          >
            <Check
              size={13}
              strokeWidth={2.5}
              className="mt-0.5 shrink-0 text-[#0A9E6E]"
            />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
