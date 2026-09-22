"use client";
import { Trash2 } from "lucide-react";
import type { ManualAssetConfig } from "./account-types/manual-assets";
import { ManualAssetFormTrigger } from "./account-types/ManualAssetFormTrigger";
import type { FormValues } from "./forms/shared/form-schema";
import type { ManualAssetEntry } from "../store/useManualAssetsStore";

/**
 * The saved entries of one manual asset category, listed under its
 * Connected Accounts row (the reference's ManualAssetSummary): title, a
 * supporting line, edit and delete, then "Add Another".
 */
export function AddedInvestments({
  config,
  entries,
  onAdd,
  onUpdate,
  onDelete,
}: {
  config: ManualAssetConfig;
  entries: ManualAssetEntry[];
  onAdd: (data: FormValues) => void;
  onUpdate: (id: string, data: FormValues) => void;
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5 border-t border-slate-50 pt-2 dark:border-slate-800/40">
      {entries.map((entry) => {
        const { title, subtitle } = config.summarize(entry.data);
        return (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-2 py-1"
          >
            <div className="min-w-0">
              <p className="text-forest-deep truncate text-[11px] font-medium dark:text-white">
                {title}
              </p>
              {subtitle && (
                <p className="truncate text-[9.5px] text-slate-400">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ManualAssetFormTrigger
                config={config}
                look="icon-edit"
                triggerText="Edit"
                initialData={entry.data}
                onSave={(data) => onUpdate(entry.id, data)}
              />
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                aria-label={`Delete ${title}`}
                title="Delete"
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}
      <div className="pt-1">
        <ManualAssetFormTrigger
          config={config}
          look="link"
          triggerText="Add Another"
          onSave={onAdd}
        />
      </div>
    </div>
  );
}
