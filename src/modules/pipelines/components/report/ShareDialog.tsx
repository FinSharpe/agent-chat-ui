"use client";

import { useState } from "react";
import { Copy, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { researchRoutes } from "../../constants/routes";
import { useShareActions } from "../../hooks/usePipelineQueries";

/**
 * Minting and revoking a public link.
 *
 * The link is genuinely public — anyone holding it reads the report without an
 * account — so the dialog says that plainly rather than calling it "sharing".
 * Revoking is the only kill switch, which is why it is a peer of the copy
 * button and not hidden behind a menu.
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
        <Button
          variant="outline"
          size="sm"
        >
          <Share2 className="size-4" />
          {isShared ? "Shared" : "Share"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this report</DialogTitle>
          <DialogDescription>
            A share link opens the full report for anyone who has it — no
            account, no sign-in. Revoke it and the link stops working
            immediately.
          </DialogDescription>
        </DialogHeader>

        {url ? (
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Public share link"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={onCopy}
              aria-label="Copy link"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={onMint}
            disabled={mint.isPending}
          >
            {mint.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            {isShared ? "Show the existing link" : "Create a share link"}
          </Button>
        )}

        {(isShared || url) && (
          <Button
            variant="ghost"
            onClick={onRevoke}
            disabled={revoke.isPending}
            className="text-error-fg hover:text-error-fg"
          >
            {revoke.isPending && <Loader2 className="size-4 animate-spin" />}
            Revoke the link
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
