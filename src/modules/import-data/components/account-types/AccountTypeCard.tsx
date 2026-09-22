"use client";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useMounted } from "../../hooks/useMounted";
import {
  useManualAssetsStore,
  type ManualAssetCategory,
} from "../../store/useManualAssetsStore";
import { AddedInvestments } from "../AddedInvestments";
import { ANALYSE_PILL, AccountRow } from "./AccountRow";
import { MANUAL_ASSETS, manualAssetPrompt } from "./manual-assets";
import { ManualAssetFormTrigger } from "./ManualAssetFormTrigger";

const NO_ENTRIES: never[] = [];

/**
 * A Connected Accounts row for a manual tracker (FD, insurance, real estate,
 * commodities, other). Connect opens the add form; saved entries list under
 * the row, and Analyse opens a chat about them.
 */
export function AccountTypeCard({
  category,
  tone = 0,
}: {
  category: ManualAssetCategory;
  tone?: number;
}) {
  const config = MANUAL_ASSETS[category];
  const mounted = useMounted();
  const { createNewChat } = useAppNavigation();
  const stored = useManualAssetsStore((s) => s.entries[category]);
  const addEntry = useManualAssetsStore((s) => s.addEntry);
  const updateEntry = useManualAssetsStore((s) => s.updateEntry);
  const removeEntry = useManualAssetsStore((s) => s.removeEntry);

  // Entries come from localStorage — none until mounted, so SSR matches.
  const entries = (mounted && stored) || NO_ENTRIES;
  const hasEntries = entries.length > 0;

  const handleDelete = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    removeEntry(category, id);
    if (entry) {
      toast.success(`${config.summarize(entry.data).title} removed`, {
        action: {
          label: "Undo",
          onClick: () => addEntry(category, entry.data),
        },
      });
    }
  };

  return (
    <AccountRow
      icon={config.icon}
      tone={tone}
      title={config.title}
      description={config.description}
      status={hasEntries ? `${entries.length} saved` : "Not connected"}
      statusTone={hasEntries ? "connected" : "idle"}
      trailing={
        hasEntries ? (
          <button
            type="button"
            onClick={() => createNewChat(manualAssetPrompt(config, entries))}
            className={ANALYSE_PILL}
          >
            Analyse
          </button>
        ) : (
          <ManualAssetFormTrigger
            config={config}
            look="connect"
            triggerText="Connect"
            onSave={(data) => addEntry(category, data)}
          />
        )
      }
    >
      <AddedInvestments
        config={config}
        entries={entries}
        onAdd={(data) => addEntry(category, data)}
        onUpdate={(id, data) => updateEntry(category, id, data)}
        onDelete={handleDelete}
      />
    </AccountRow>
  );
}

/** A row for an account type that has no connection path yet (NPS). */
export function ComingSoonAccountRow({
  icon,
  title,
  description,
  tone = 0,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: number;
}) {
  return (
    <AccountRow
      icon={icon}
      tone={tone}
      title={title}
      description={description}
      status="Not connected"
      statusTone="idle"
      trailing={
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-medium text-slate-400 dark:bg-slate-800">
          Coming soon
        </span>
      }
    />
  );
}
