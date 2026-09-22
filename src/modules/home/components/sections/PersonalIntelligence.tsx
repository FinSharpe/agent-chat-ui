"use client";

import type { ReactNode } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionKit";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import {
  ACCOUNT_LABELS,
  HEALTH_CHECK_PROMPT,
  LINK_PRIORITY,
} from "../../constants/linkedAccounts";
import { formatAccountList } from "../../utils/formatAccountList";

function SummaryCard({
  eyebrow, icon, title, body, cta, onCta,
}: {
  eyebrow: string;
  icon: ReactNode;
  title: string;
  body: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="glass-card rounded-card p-5 space-y-2.5 premium-shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          {eyebrow}
        </span>
        <span className="shrink-0">{icon}</span>
      </div>
      <span className="text-base font-medium text-[#0A1F4D] font-geist block">
        {title}
      </span>
      <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
      <button
        onClick={onCta}
        className="text-xs text-[#063BAA] font-medium flex items-center gap-1 pt-1"
      >
        {cta} <ArrowRight size={12} />
      </button>
    </div>
  );
}

/**
 * Shown once the user has linked at least one account — the reference's
 * connected-state summary. The linked/missing status is real (from the
 * stored consents); the app keeps no portfolio health score, so that card
 * hands the question to the agent instead of showing a figure.
 */
export function PersonalIntelligence({
  linked, missing, onAsk, onOpenImport,
}: {
  linked: ConsentType[];
  missing: ConsentType[];
  onAsk: (prompt: string) => void;
  onOpenImport: () => void;
}) {
  const nextToLink = LINK_PRIORITY.find((t) => missing.includes(t));

  return (
    <section className="space-y-3">
      <SectionLabel className="pl-1">Personal Intelligence</SectionLabel>
      <div className="space-y-3">
        <SummaryCard
          eyebrow="Portfolio Health"
          icon={<Sparkles size={14} className="text-[#063BAA]" />}
          title="Ready for a check-up"
          body="Ask for a concentration, fund overlap and quality review of the accounts you've linked."
          cta="Run check"
          onCta={() => onAsk(HEALTH_CHECK_PROMPT)}
        />
        <SummaryCard
          eyebrow="Linked Accounts"
          icon={<ShieldCheck size={14} className="text-[#0A9E6E]" />}
          title={nextToLink ? "Partial" : "Complete"}
          body={
            nextToLink
              ? `${formatAccountList(linked)} linked. ${formatAccountList(missing)} missing.`
              : `${formatAccountList(linked)} linked.`
          }
          cta={nextToLink ? `Link ${ACCOUNT_LABELS[nextToLink].short}` : "Manage accounts"}
          onCta={onOpenImport}
        />
      </div>
    </section>
  );
}
