"use client";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import {
  WATCHLIST_CARDS,
  type WatchlistCard,
  type WatchlistCardId,
} from "../../constants/watchlist";
import { useMounted } from "../../hooks/useMounted";
import { useWatchlistStore, type WatchlistGroup } from "../../store/useWatchlistStore";
import { ImportOverlayPortal } from "../page/ImportOverlayPortal";
import { SectionTitle } from "../page/SectionTitle";
import { AddSecuritiesModal } from "./AddSecuritiesModal";
import { ViewHoldingsModal } from "./ViewHoldingsModal";
import { WatchlistGroupCard } from "./WatchlistGroupCard";

const analysePrompt = (card: WatchlistCard, name: string, securities: string[]) =>
  `Analyse my ${card.analyseAllLabel.toLowerCase()} watchlist "${name}": ${securities.join(", ")}. For each, cover valuation, the technical setup and recent news, then tell me which look most attractive to buy now and why.`;

/**
 * The Watchlist view — securities the user tracks without owning them:
 * an overview count, then one card per asset type with saved groups. Groups
 * are kept in this browser (useWatchlistStore); Analyse opens a chat.
 */
export function WatchlistView() {
  const mounted = useMounted();
  const { createNewChat } = useAppNavigation();
  const groupsByCard = useWatchlistStore((s) => s.groups);
  const addGroup = useWatchlistStore((s) => s.addGroup);
  const removeGroup = useWatchlistStore((s) => s.removeGroup);
  const addSecurity = useWatchlistStore((s) => s.addSecurity);
  const removeSecurity = useWatchlistStore((s) => s.removeSecurity);

  const [openCards, setOpenCards] = useState<Set<WatchlistCardId>>(new Set());
  const [addingTo, setAddingTo] = useState<WatchlistCard | null>(null);
  const [editing, setEditing] = useState<{ card: WatchlistCard; groupId: string } | null>(null);

  const groupsFor = (id: WatchlistCardId) => (mounted ? (groupsByCard[id] ?? []) : []);
  // Derived live so edits made inside the popup show at once.
  const editingGroup = editing
    ? groupsFor(editing.card.id).find((g) => g.id === editing.groupId) ?? null
    : null;

  const counts = WATCHLIST_CARDS.map((c) => ({
    id: c.id,
    label: c.analyseAllLabel,
    count: groupsFor(c.id).reduce((n, g) => n + g.securities.length, 0),
  }));
  const total = counts.reduce((n, c) => n + c.count, 0);

  const toggle = (id: WatchlistCardId) =>
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteGroup = (card: WatchlistCard, group: WatchlistGroup) => {
    removeGroup(card.id, group.id);
    toast.success(`"${group.name}" deleted`, {
      action: {
        label: "Undo",
        onClick: () => addGroup(card.id, group.name, group.securities),
      },
    });
  };

  return (
    <div className="space-y-7">
      <section className="space-y-3">
        <SectionTitle>Watchlist Overview</SectionTitle>
        <div className="glass-card space-y-4 rounded-card p-6">
          <div className="space-y-1">
            <p className="text-[10px] tracking-wider text-slate-400 uppercase">
              Total Securities Tracked
            </p>
            <p className="stat-hero text-forest-deep text-[32px] dark:text-white">
              {total}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-3 dark:border-slate-800/40">
            {counts.map((c) => (
              <div key={c.id}>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#063BAA]" />
                  <span className="text-[9px] text-slate-400">{c.label}</span>
                </div>
                <p className="text-forest-deep mt-0.5 text-[13px] font-medium dark:text-white">
                  {c.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionBanner
        eyebrow="Watchlist groups"
        title="Track securities without connecting an account"
        tone="mint"
        height={260}
        image={BANNER_WAVE.cyan}
        imageScrim
      />

      <div className="space-y-2.5">
        {WATCHLIST_CARDS.map((card) => {
          const groups = groupsFor(card.id);
          return (
            <WatchlistGroupCard
              key={card.id}
              card={card}
              groups={groups}
              isOpen={openCards.has(card.id)}
              onToggle={() => toggle(card.id)}
              onAddSecurities={() => setAddingTo(card)}
              onAnalyseAll={() => {
                const all = [...new Set(groups.flatMap((g) => g.securities))];
                createNewChat(analysePrompt(card, `all ${card.analyseAllLabel}`, all));
              }}
              onAnalyseGroup={(g) => createNewChat(analysePrompt(card, g.name, g.securities))}
              onEditGroup={(g) => setEditing({ card, groupId: g.id })}
              onDeleteGroup={(g) => deleteGroup(card, g)}
            />
          );
        })}
      </div>

      <ImportOverlayPortal>
        <AnimatePresence>
          {addingTo && (
            <AddSecuritiesModal
              key="add"
              card={addingTo}
              onClose={() => setAddingTo(null)}
              onSave={(name, securities) => {
                addGroup(addingTo.id, name, securities);
                setOpenCards((prev) => new Set(prev).add(addingTo.id));
                setAddingTo(null);
                toast.success(`"${name}" saved`);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {editing && editingGroup && (
            <ViewHoldingsModal
              key="edit"
              card={editing.card}
              group={editingGroup}
              onClose={() => setEditing(null)}
              onAddSecurity={(s) => addSecurity(editing.card.id, editing.groupId, s)}
              onRemoveSecurity={(s) => removeSecurity(editing.card.id, editing.groupId, s)}
            />
          )}
        </AnimatePresence>
      </ImportOverlayPortal>
    </div>
  );
}
