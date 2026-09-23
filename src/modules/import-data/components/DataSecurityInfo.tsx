import { ExternalLink, Lock } from "lucide-react";
import { PRIVACY_URL } from "@/modules/account-deletion/constants/content";
import { SectionTitle } from "./page/SectionTitle";

/**
 * "How we use your data" — ported from finsharpe-mobile's `_DataUsageSection`
 * (`portfolio_tab.dart`), which is the reviewed wording (T-05).
 *
 * The old copy here claimed the data was processed locally under bank-level
 * encryption and reached no third party. None of that is true: holdings go to
 * FinSharpe's servers to be analysed, and holdings asked about in chat reach
 * the model that answers. Each line below can be pointed at a clause of the
 * privacy policy, exactly as the mobile card's comment records.
 *
 * Mobile's third line — a copy kept in the app's private storage on the phone
 * — is left out: the web app holds no portfolio in browser storage, so it has
 * nothing to disclose there. Change the two apps together otherwise.
 */
const DATA_USAGE = [
  "We use your holdings to show your portfolio and analyse allocation, returns and risk — nothing else.",
  "Analysis runs on FinSharpe servers: holdings are sent there to be processed, not stored.",
  "Ask about your portfolio in chat and those holdings go to the AI model that answers you.",
  "You can disconnect any account at any time. We never sell your data.",
];

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
            className="flex gap-2.5 border-b border-slate-100 py-3 text-[11px] leading-snug text-slate-500 dark:border-slate-800/60 dark:text-slate-400"
          >
            {/* A mint check beside "go to the AI model" would read as a promise
                about something that is simply a fact, so each line is marked
                with a faint dot instead — as finsharpe-mobile's card does. */}
            <span
              aria-hidden
              className="mt-[6px] size-1 shrink-0 rounded-full bg-slate-400"
            />
            {line}
          </li>
        ))}
      </ul>
      {/* The long version, one tap from the short one. */}
      <a
        href={PRIVACY_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 py-3 text-[11px] leading-snug font-medium text-[#063BAA] hover:underline dark:text-[#8FB4FF]"
      >
        Privacy Policy
        <ExternalLink
          size={11}
          aria-hidden
        />
      </a>
    </section>
  );
}
