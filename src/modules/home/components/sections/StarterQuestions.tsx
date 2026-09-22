"use client";

import { ListRow, SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { STARTER_QUESTIONS } from "../../constants/features";

/** Four ready-made questions; each opens a fresh chat that asks it. Desktop
 *  frames the rows in one card, mobile leaves them cardless.
 *
 *  The reference switched the label on a "connected accounts" state read from
 *  browser-local consents. That store is gone (T-11) and Home no longer looks
 *  at what is linked (T-03), so the section keeps the invitation wording. */
export function StarterQuestions({
  onAsk,
}: {
  onAsk: (prompt: string) => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <section className="space-y-2">
      <SectionLabel className="pl-1">Start with Chat</SectionLabel>
      <div
        className={
          isDesktopWeb
            ? "glass-card rounded-card premium-shadow-sm px-5 py-3"
            : undefined
        }
      >
        {STARTER_QUESTIONS.map((q, idx) => {
          const Icon = q.icon;
          return (
            <ListRow
              key={q.task}
              icon={<Icon size={18} />}
              title={q.task}
              sub={q.category}
              tone={idx}
              onClick={() => onAsk(q.task)}
            />
          );
        })}
      </div>
    </section>
  );
}
