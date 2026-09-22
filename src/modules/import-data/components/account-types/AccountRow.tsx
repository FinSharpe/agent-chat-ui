import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Icon-tile colours cycle down the list, as in the reference. */
const TONES = [
  { bg: "bg-[#063BAA]/8", fg: "text-[#063BAA] dark:text-[#8FB4FF]" },
  { bg: "bg-[#97edcc]/30", fg: "text-[#0A9E6E]" },
  { bg: "bg-[#0A1F4D]/8 dark:bg-white/10", fg: "text-forest-deep dark:text-white" },
];

export type AccountStatusTone = "connected" | "connecting" | "warning" | "idle";

const STATUS_CLASS: Record<AccountStatusTone, string> = {
  connected: "text-[#0A9E6E]",
  connecting: "text-amber-600",
  warning: "text-amber-600",
  idle: "text-slate-400",
};

/**
 * One Connected Accounts row: icon tile, name, description, a status line
 * coloured by state, and the row's control on the right. `statusActions`
 * sit inline after the status text (refresh / remove), keeping the right-hand
 * slot to the single pill the reference shows. `children` render below the
 * row (the saved entries of a manual asset).
 */
export function AccountRow({
  icon: Icon,
  tone,
  title,
  description,
  status,
  statusTone,
  statusActions,
  trailing,
  children,
}: {
  icon: LucideIcon;
  tone: number;
  title: string;
  description: string;
  status: string;
  statusTone: AccountStatusTone;
  statusActions?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const t = TONES[tone % TONES.length];
  return (
    <div className="border-b border-slate-100 py-3.5 last:border-b-0 dark:border-slate-800/60">
      <div className="flex items-center gap-3.5">
        <div
          className={`rounded-tile flex h-10 w-10 shrink-0 items-center justify-center ${t.bg} ${t.fg}`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-forest-deep text-[13px] leading-snug font-medium dark:text-white">
            {title}
          </p>
          <p className="line-clamp-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            {description}
          </p>
          <div className="flex min-h-[18px] items-center gap-1">
            <p className={`text-[10px] font-medium ${STATUS_CLASS[statusTone]}`}>
              {status}
            </p>
            {statusActions}
          </div>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

/** Small round icon action for a row's status line (refresh, remove…). */
export function RowIconButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`-my-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50 ${
        destructive
          ? "text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
          : "text-slate-400 hover:bg-[#DFF9EF] hover:text-[#0A1F4D] dark:hover:bg-blue-500/10 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/** Reference "Connect" pill (brand gradient). */
export const CONNECT_PILL =
  "bg-brand-gradient shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium text-white hover:brightness-110";

/** Reference "Analyse" pill (mint). */
export const ANALYSE_PILL =
  "shrink-0 rounded-full bg-[#DFF9EF] px-3 py-1.5 text-[10px] font-medium text-[#0A1F4D]";
