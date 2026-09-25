"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteAccountMutation } from "../../hooks/useDeleteAccountMutation";

const CONFIRM_WORD = "DELETE";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The one confirmation gesture before an irreversible delete: type DELETE.
 * Stays open on failure, with the reason, because the account still exists.
 */
export default function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const [typed, setTyped] = useState("");
  const deletion = useDeleteAccountMutation();

  // Success reloads the page, so a settled mutation still pending the reload
  // keeps the dialog locked too.
  const busy = deletion.isPending || deletion.isSuccess;
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  const handleOpenChange = (next: boolean) => {
    if (busy) return;
    if (!next) {
      setTyped("");
      deletion.reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (confirmed && !busy) deletion.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your FinSharpe account, your chats, and
              your imported portfolio and its MoneyOne consents. Your reports
              are removed from your account and their share links stop working.
              Unused credits are lost. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="delete-account-confirm">
              Type {CONFIRM_WORD} to confirm
            </Label>
            <Input
              id="delete-account-confirm"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={busy}
            />
          </div>

          {deletion.isError && (
            <p
              role="alert"
              className="border-error-border bg-error-bg text-error-fg rounded-md border px-3 py-2 text-sm"
            >
              {deletion.error.message}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!confirmed || busy}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Delete account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
