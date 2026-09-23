"use client";

import { useState } from "react";
import { Copy, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { researchRoutes } from "../../constants/routes";
import { useShareActions } from "../../hooks/usePipelineQueries";
import { CIRCLE_BUTTON, PRIMARY_BUTTON, QUIET_BUTTON } from "../shared/kit";

/**
 * Minting and revoking a public link.
 *
 * The link is genuinely public — anyone holding it reads the report without an
 * account — so the dialog says that plainly rather than calling it "sharing".
 * Revoking is the only kill switch, which is why it is a peer of the copy
 * button and not hidden behind a menu.
 *
 * The trigger is the report header's share button; it reads as "on" (brand
 * tint) while a link is live, the way the reference marks a tracked basket.
 */
export function ShareDialog({
  purchaseId,
  isShared,
}: {
  purchaseId: string;
  isShared: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const { mint, revoke } = useShareActions();

  async function onMint() {
    try {
      const response = await mint.mutateAsync(purchaseId);
      // The backend builds its URL from PUBLIC_APP_BASE_URL, which may be
      // unset in a local deployment; the token is the part that matters, so
      // the link is rebuilt against wherever this page is being served from.
      setUrl(
        new URL(
          researchRoutes.shared(response.share_token),
          window.location.origin,
        ).toString(),
      );
    } catch {
      toast.error("The share link could not be created.");
    }
  }

  async function onRevoke() {
    try {
      await revoke.mutateAsync(purchaseId);
      setUrl(null);
      toast.success("The share link no longer works.");
      setOpen(false);
    } catch {
      toast.error("The share link could not be revoked.");
    }
  }

  async function onCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied.");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setUrl(null);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            CIRCLE_BUTTON,
            isShared && "bg-[#063BAA]/8 text-[#063BAA]",
          )}
          title={isShared ? "Shared — manage the link" : "Share"}
          aria-label={isShared ? "Manage the share link" : "Share this report"}
        >
          <Share2 size={14} />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-card font-funnel gap-5 border-slate-100 p-6 sm:max-w-md">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="font-geist text-sm font-medium text-[#0A1F4D] dark:text-white">
            Share this report
          </DialogTitle>
          <DialogDescription className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            A share link opens the full report for anyone who has it — no
            account, no sign-in. Revoke it and the link stops working
            immediately.
          </DialogDescription>
        </DialogHeader>

        {url ? (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Public share link"
              className="glass-tile min-w-0 flex-1 rounded-full px-4 py-2.5 text-[11px] text-[#0A1F4D] focus:outline-none"
            />
            <button
              type="button"
              onClick={onCopy}
              aria-label="Copy link"
              className="bg-brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-all hover:brightness-110"
            >
              <Copy size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onMint}
            disabled={mint.isPending}
            className={cn(PRIMARY_BUTTON, "py-3 text-[11px]")}
          >
            {mint.isPending ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Link2 size={14} />
            )}
            {isShared ? "Show the existing link" : "Create a share link"}
          </button>
        )}

        {(isShared || url) && (
          <button
            type="button"
            onClick={onRevoke}
            disabled={revoke.isPending}
            className={cn(QUIET_BUTTON, "text-rose-500 hover:text-rose-600")}
          >
            {revoke.isPending && (
              <Loader2
                size={12}
                className="animate-spin"
              />
            )}
            Revoke the link
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
