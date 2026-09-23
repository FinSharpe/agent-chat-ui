"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { Check, ChevronDown, Layers } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ChatModelOption } from "../api/chatModels";
import { useChatModels } from "../hooks/useChatModels";
import { useChatPrefsStore } from "../store/useChatPrefsStore";

const AUTO_LABEL = "Auto";

/**
 * The composer's model pill and its popover — finsharpe-mobile's picker
 * (#157) in the web's popover styling. **Auto** is always the first row and
 * means no pin: the backend's switcher picks a model per message. Below it,
 * the models `GET /api/models` offers, grouped by provider in the server's
 * order. A pick belongs to the open chat and closes the list.
 *
 * `compact` is the phone pill: smaller, next to the mic.
 */
export default function ModelPicker({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [threadId] = useQueryState("threadId");
  const model = useChatPrefsStore((s) => s.model);
  const pick = useChatPrefsStore((s) => s.pick);
  const { data: models = [] } = useChatModels();

  const pickable = models.filter((m) => m.available);
  const selected = pickable.find((m) => m.id === model) ?? null;
  const groups = groupByProvider(pickable);

  const choose = (id: string | null) => {
    if (id !== model) pick(id, threadId);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Model"
          className={cn(
            "flex shrink-0 items-center rounded-full bg-[#DFF9EF] font-medium text-[#0A1F4D] transition-colors",
            compact
              ? "h-8 gap-1 pr-2.5 pl-2 text-[11px]"
              : "h-9 gap-1.5 pr-3 pl-3.5 text-[12px]",
          )}
        >
          <Layers size={13} />
          <span className="max-w-[220px] truncate">
            {selected?.shortLabel ?? AUTO_LABEL}
          </span>
          {/* The phone bar is tight: the model name matters more than the
              caret, and the pill still reads as a control. */}
          {!compact && (
            <ChevronDown
              size={12}
              className={cn("transition-transform", open && "rotate-180")}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={10}
        collisionPadding={12}
        className="rounded-nested max-h-[min(440px,70vh)] w-64 space-y-3 overflow-y-auto border-slate-100 bg-white p-3.5 text-[#0A1F4D] shadow-[0_10px_30px_rgba(10,31,77,0.12)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
          <span className="font-geist text-[11px] font-medium text-[#0A1F4D]">
            AI Model
          </span>
          <span className="truncate text-[9px] font-medium text-slate-400">
            {selected?.label ?? AUTO_LABEL} selected
          </span>
        </div>
        <div className="space-y-1">
          <Row
            label={AUTO_LABEL}
            description="Picks a model for each message"
            isOn={selected === null}
            onClick={() => choose(null)}
          />
        </div>
        {groups.map(([provider, rows]) => (
          <div
            key={provider}
            className="space-y-1"
          >
            <span className="block px-1.5 text-[8px] font-medium tracking-wider text-slate-400 uppercase">
              {provider}
            </span>
            {rows.map((m) => (
              <Row
                key={m.id}
                label={m.label}
                isOn={m.id === selected?.id}
                onClick={() => choose(m.id)}
              />
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function groupByProvider(
  models: ChatModelOption[],
): [string, ChatModelOption[]][] {
  const groups = new Map<string, ChatModelOption[]>();
  for (const m of models) {
    const rows = groups.get(m.provider) ?? [];
    rows.push(m);
    groups.set(m.provider, rows);
  }
  return [...groups.entries()];
}

function Row({
  label,
  description,
  isOn,
  onClick,
}: {
  label: string;
  description?: string;
  isOn: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover-tint rounded-tile flex w-full items-center justify-between gap-3 px-1.5 py-1.5 text-left transition-colors"
    >
      <span className="min-w-0">
        <span
          className={cn(
            "block text-[11px]",
            isOn ? "font-medium text-[#0A1F4D]" : "text-slate-500",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="block text-[9px] leading-snug text-slate-400">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all",
          isOn
            ? "bg-[#063BAA] text-white"
            : "border border-slate-200 dark:border-slate-700",
        )}
      >
        {isOn && (
          <Check
            size={10}
            strokeWidth={3.5}
          />
        )}
      </span>
    </button>
  );
}
