"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  ALERT_CLASS_LABELS,
  allClearLine,
  emphasisRuns,
  metaLine,
  type SmartAlertGroup,
  type SmartAlertItem,
} from "../../utils/smart-alerts";

/*
 * The Smart Alerts card, grouped by asset class (#86, after finsharpe-mobile
 * `smart_alerts_card.dart`, #173): the reference's one glass card
 * (`ImportScreen.tsx:686-729`) that scrolls inside itself, about two alerts
 * tall. Each class opens on a sticky header, pinned within its own group so
 * the next class's header pushes it off. Two departures from the reference,
 * both the owner's: `Ask AI →` in place of the stretched pill, and no tone
 * tile — the verdict in the meta line carries the tone.
 */

const HAIRLINE = "border-slate-100 dark:border-slate-800/60";

export function SmartAlertsFrame({ children }: { children: ReactNode }) {
  return (
    <div className="glass-card scrollbar-none rounded-card max-h-[406px] overflow-y-auto overscroll-contain">
      {children}
    </div>
  );
}

export function SmartAlertsCard({
  groups,
  onAsk,
}: {
  groups: SmartAlertGroup[];
  onAsk: (alert: SmartAlertItem) => void;
}) {
  return (
    <SmartAlertsFrame>
      {groups.map((group, i) => (
        <section
          key={group.assetClass}
          aria-label={ALERT_CLASS_LABELS[group.assetClass]}
        >
          <GroupHeader
            group={group}
            first={i === 0}
          />
          {group.alerts.length === 0 ? (
            <p className="px-4.5 py-3.5 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              {allClearLine(group.assetClass)}
            </p>
          ) : (
            <div className={`divide-y ${HAIRLINE}`}>
              {group.alerts.map((alert) => (
                <SmartAlertBlock
                  key={`${alert.kind}:${alert.title}`}
                  alert={alert}
                  onAsk={() => onAsk(alert)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </SmartAlertsFrame>
  );
}

/** `EQUITIES          3` on the card's own fill, so the blocks scroll under. */
function GroupHeader({
  group,
  first,
}: {
  group: SmartAlertGroup;
  first: boolean;
}) {
  const count = group.alerts.length;
  return (
    <h4
      className={`sticky top-0 z-[1] flex items-center justify-between border-b bg-[var(--card-bg)] px-4.5 pt-3 pb-2 text-[10px] font-medium tracking-wider text-slate-400 uppercase ${HAIRLINE} ${first ? "" : "border-t"}`}
    >
      <span>{ALERT_CLASS_LABELS[group.assetClass]}</span>
      {count > 0 && (
        <span aria-label={count === 1 ? "1 alert" : `${count} alerts`}>
          {count}
        </span>
      )}
    </h4>
  );
}

/** Title over `verdict · meta`, the line with its figures in bold, then
 *  `Ask AI →` on the right — no hairline above it. */
function SmartAlertBlock({
  alert,
  onAsk,
}: {
  alert: SmartAlertItem;
  onAsk: () => void;
}) {
  const meta = metaLine(alert);
  const line = alert.line?.trim();
  return (
    <div className="px-4.5 pt-4.5">
      <p className="text-forest-deep font-geist text-[13px] leading-snug font-medium dark:text-white">
        {alert.title}
      </p>
      {meta && (
        <p className="mt-0.5 truncate text-[10.5px] text-slate-400">{meta}</p>
      )}
      {line && (
        <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          {emphasisRuns(line).map((run, i) =>
            run.strong ? (
              <span
                key={i}
                className="text-forest-deep font-medium dark:text-white"
              >
                {run.text}
              </span>
            ) : (
              run.text
            ),
          )}
        </p>
      )}
      <div className="mt-1 flex justify-end">
        <AskAiLink
          label={`Ask AI about ${alert.title}`}
          onClick={onAsk}
        />
      </div>
    </div>
  );
}

/** The footer's `Ask AI →` (reference `text-[#063BAA] font-medium` + a 10px
 *  arrow): a 44px-tall target whose left padding widens it past the words. */
export function AskAiLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="hover-tint rounded-tile flex h-11 items-center gap-1 pl-3 text-[11px] font-medium text-[#063BAA] dark:text-[#8FB4FF]"
    >
      Ask AI
      <ArrowRight size={10} />
    </button>
  );
}

const shimmer =
  "block animate-pulse rounded bg-slate-100 dark:bg-slate-800 motion-reduce:animate-none";

export function SmartAlertSkeleton() {
  return (
    <div
      className="space-y-2 px-4.5 pt-4.5 pb-5"
      aria-hidden="true"
    >
      <span className={`${shimmer} h-3.5 w-1/2`} />
      <span className={`${shimmer} h-3 w-1/3`} />
      <span className={`${shimmer} mt-3 h-3 w-full`} />
      <span className={`${shimmer} h-3 w-4/5`} />
      <span className={`${shimmer} mt-2 ml-auto h-3 w-12`} />
    </div>
  );
}
