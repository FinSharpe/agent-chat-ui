import { Link2, LogIn, UserRound } from "lucide-react";
import {
  portfolioConnectCopy,
  type PortfolioConnect,
} from "@/lib/portfolio-connect";

/**
 * The connect card as drawn: finsharpe-mobile's `PortfolioConnectCard` (#189,
 * signed off 2026-09-18) — an icon tile and a title, the classes as chips when
 * there are several, one line on OneMoney, and one gradient pill. It prints no
 * route note: where the button leads is documentation, not something the
 * reader is shown.
 *
 * Pure — the button's action is the caller's, so this renders anywhere
 * (including the node checks in `scripts/portfolio-connect`).
 */
export function PortfolioConnectCardView({
  connect,
  onAction,
}: {
  connect: PortfolioConnect;
  onAction: () => void;
}) {
  const copy = portfolioConnectCopy(connect);
  const signIn = connect.reason === "not_signed_in";
  const Icon = signIn ? UserRound : Link2;
  const CtaIcon = signIn ? LogIn : Link2;

  return (
    <section
      aria-label={copy.title}
      data-portfolio-connect={connect.reason}
      className="glass-card rounded-nested font-funnel w-full max-w-[420px] p-4"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-tile flex h-10 w-10 shrink-0 items-center justify-center bg-[#063BAA]/8 text-[#063BAA] dark:bg-[#22335C] dark:text-[#8FB4FF]">
          <Icon size={18} />
        </span>
        <p className="font-geist min-w-0 flex-1 pt-0.5 text-[13px] leading-snug font-medium text-[#0A1F4D] dark:text-white">
          {copy.title}
        </p>
      </div>

      {copy.chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {copy.chips.map((name) => (
            <li
              key={name}
              className="rounded-full bg-[#063BAA]/8 px-2.5 py-1 text-[10.5px] font-medium text-[#063BAA] dark:bg-[#22335C] dark:text-[#8FB4FF]"
            >
              {name}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {copy.body}
      </p>

      <button
        type="button"
        onClick={onAction}
        className="bg-brand-gradient mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[12px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(6,59,170,0.55)] transition-all hover:brightness-110 active:scale-98"
      >
        <CtaIcon size={15} />
        {copy.cta}
      </button>
    </section>
  );
}
