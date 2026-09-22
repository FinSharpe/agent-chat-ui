"use client";
import { cn } from "@/lib/utils";
import { MoreVertical, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import type { ConsentTrouble } from "../../utils/aa-fold";
import type { ClassPosition } from "../../utils/aa-fold";
import { rowCaption, type CaptionTone } from "../../utils/aa-captions";
import { CLASS_META, CLASS_TONE_CLASS } from "./account-class-meta";

const CAPTION_CLASS: Record<CaptionTone, string> = {
  warning: "text-amber-600 dark:text-amber-400",
  negative: "text-rose-600 dark:text-rose-400",
  muted: "text-slate-500 dark:text-slate-400",
  value: "text-forest-deep tabular-nums dark:text-white",
};

/**
 * One asset class in "Your accounts" — the mobile `_AccountRow`
 * (`portfolio_tab.dart` ln 1475-1658) in this app's design language.
 *
 * The row speaks for every consent of its class at once, so the body tap
 * follows the folded state: unconnected starts the connect flow, a class with
 * data opens its analysis, a syncing class does nothing (there is nothing to
 * open and nothing to fix), and a broken one opens the manage sheet.
 */
export function AaAccountRow({
  position,
  trouble,
  onConnect,
  onOpenAnalysis,
  onManage,
  analyseSlot,
}: {
  position: ClassPosition;
  trouble: ConsentTrouble;
  onConnect: () => void;
  onOpenAnalysis: () => void;
  onManage: () => void;
  /**
   * The class's analysis modal, which owns its own "Analyse" trigger. Given
   * only when the class has data.
   */
  analyseSlot?: ReactNode;
}) {
  const { icon: Icon, tone } = CLASS_META[position.type];
  const caption = rowCaption(position, trouble);
  const connected = position.state !== "unconnected";
  const syncing = position.state === "syncing";

  const handleBody = () => {
    if (!connected) return onConnect();
    if (position.hasData) return onOpenAnalysis();
    if (syncing) return;
    onManage();
  };

  const interactive = !(connected && syncing && !position.hasData);

  return (
    <div className="border-b border-slate-100 last:border-b-0 dark:border-slate-800/60">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBody}
          disabled={!interactive}
          className={cn(
            "-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors",
            interactive ? "hover-tint" : "cursor-default",
          )}
        >
          <span
            className={cn(
              "rounded-tile flex h-10 w-10 shrink-0 items-center justify-center",
              CLASS_TONE_CLASS[tone],
              !connected && "opacity-55",
            )}
          >
            <Icon size={18} />
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block text-[12px] leading-snug font-medium",
                connected
                  ? "text-forest-deep dark:text-white"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {position.label}
            </span>
            {caption && (
              <span
                className={cn(
                  "mt-px block text-[10px] leading-snug font-medium",
                  caption.clamp === 2 ? "line-clamp-2 font-normal" : "truncate",
                  CAPTION_CLASS[caption.tone],
                )}
              >
                {caption.text}
              </span>
            )}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {!connected ? (
            <button
              type="button"
              onClick={onConnect}
              className="bg-brand-gradient h-7 shrink-0 rounded-full px-3 text-[10px] font-semibold text-white transition-all hover:brightness-110 active:scale-98"
            >
              Connect
            </button>
          ) : (
            <>
              {syncing && !position.hasData && (
                // A static glyph, not a spinner: the caption already says
                // "Syncing…" and a loop would never let the row settle.
                <RefreshCw
                  size={16}
                  aria-hidden
                  className="text-amber-600 dark:text-amber-400"
                />
              )}
              {position.hasData && (
                <span className="import-slot-analyse shrink-0">
                  {analyseSlot}
                </span>
              )}
              <button
                type="button"
                onClick={onManage}
                aria-label={`Manage ${position.label}`}
                title={`Manage ${position.label}`}
                className="hover-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors dark:text-slate-500"
              >
                <MoreVertical size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
