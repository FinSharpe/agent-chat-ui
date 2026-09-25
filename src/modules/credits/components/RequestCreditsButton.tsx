import { Mail } from "lucide-react";

import { cn } from "@/lib/utils";

import { REQUEST_CREDITS, SHORT_BALANCE_NOTICE } from "../constants/copy";

/**
 * The Credit Request: a link that opens the reader's mail app on the prefilled
 * message (`creditRequestHref`). The mint secondary pill of #231's web frames.
 * A link rather than a button, because what it does is navigate to `mailto:`.
 */
export function RequestCreditsButton({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-full bg-[#DFF9EF] px-4 text-[12.5px] font-medium text-[#0A1F4D] transition-all hover:brightness-95 active:scale-98 dark:text-[var(--tone-mint-fg)]",
        className,
      )}
    >
      <Mail size={14} />
      {REQUEST_CREDITS}
    </a>
  );
}

/**
 * The Short Balance notice with the Credit Request beside it: on the Credits
 * page when `gated`, and — from #282 — beside a refused chat answer. One
 * component so the two places cannot drift.
 */
export function ShortBalanceNotice({ requestHref }: { requestHref: string }) {
  return (
    <div
      role="status"
      className="glass-card rounded-nested flex flex-col gap-3 p-4"
    >
      <p className="text-[13px] leading-relaxed text-[#0A1F4D] dark:text-white">
        {SHORT_BALANCE_NOTICE}
      </p>
      <RequestCreditsButton href={requestHref} />
    </div>
  );
}
