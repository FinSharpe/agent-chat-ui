"use client";

import { ListRow, SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { STARTER_QUESTIONS } from "../../constants/features";

/** Four ready-made questions; each opens a fresh chat that asks it. Desktop
 *  frames the rows in one card, mobile leaves them cardless. */
export function StarterQuestions({
  label,
  onAsk,
}: {
  label: string;
  onAsk: (prompt: string) => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <section className="space-y-2">
      <SectionLabel className="pl-1">{label}</SectionLabel>
      <div
        className={
          isDesktopWeb
            ? "glass-card rounded-card px-5 py-3 premium-shadow-sm"
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
