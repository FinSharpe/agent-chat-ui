"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChatModels, usePinState } from "../hooks/useChatModels";
import { useChatPrefsStore } from "../store/useChatPrefsStore";
import { useModelChoiceStore } from "../store/useModelChoiceStore";
import { pickerGroups } from "../utils/pin";
import { ModelChoiceList, ModelPill } from "./ModelPickerParts";

/**
 * The composer's model pill and its popover — finsharpe-mobile's picker
 * (#157) in the web's popover styling. **Auto** is always the first row and
 * means no pin: the backend's switcher picks a model per message. Below it,
 * the models `GET /api/models` offers, grouped by provider in the server's
 * order. A pick belongs to the open chat and closes the list.
 *
 * A pin the server cannot serve right now — marked unavailable, or no longer
 * listed — stays the pick, shown by its last known label and marked
 * unavailable; nothing moves it to Auto (finsharpe-agents#255). A send made
 * on it is held, and this popover opens by itself asking the user to choose;
 * choosing sends it on the choice, closing without choosing sends nothing.
 * When the model comes back, the same pin simply works again.
 *
 * `compact` is the phone pill: smaller, next to the mic.
 */
export default function ModelPicker({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [browsing, setBrowsing] = useState(false);
  const [threadId] = useQueryState("threadId");
  const model = useChatPrefsStore((s) => s.model);
  const pick = useChatPrefsStore((s) => s.pick);
  const waiting = useModelChoiceStore((s) => s.held !== null);
  const { data: models = [] } = useChatModels();
  const pin = usePinState();

  const open = browsing || waiting;
  const groups = pickerGroups(models, pin);

  const choose = (id: string | null) => {
    if (id !== model) pick(id, threadId);
    setBrowsing(false);
    // A held send goes out on this choice; it re-reads the pick, so a choice
    // of the same pin that has since come back also releases it.
    useModelChoiceStore.getState().chosen();
  };

  const onOpenChange = (next: boolean) => {
    setBrowsing(next);
    if (!next && useModelChoiceStore.getState().held) {
      useModelChoiceStore.getState().cancel();
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger asChild>
        <ModelPill
          pin={pin}
          open={open}
          compact={compact}
        />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={10}
        collisionPadding={12}
        className="rounded-nested max-h-[min(440px,70vh)] w-64 space-y-3 overflow-y-auto border-slate-100 bg-white p-3.5 text-[#0A1F4D] shadow-[0_10px_30px_rgba(10,31,77,0.12)]"
      >
        <ModelChoiceList
          pin={pin}
          groups={groups}
          waiting={waiting}
          onChoose={choose}
        />
      </PopoverContent>
    </Popover>
  );
}
