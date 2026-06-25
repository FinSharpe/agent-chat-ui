/**
 * Minimal confirmation dialog, built on the existing Radix dialog primitive (no
 * extra dependency). Use it to guard irreversible or destructive actions
 * (delete, revoke, discard, etc.).
 *
 * It owns its own open + pending state. Pass a render-prop child to wire up the
 * trigger — no `useState` needed in the caller — and an async `onConfirm`: while
 * it runs the confirm button shows a spinner, and the dialog closes itself once
 * it resolves. Throw/reject from `onConfirm` to keep the dialog open (e.g. so the
 * user can retry after an error).
 *
 * @example
 * <ConfirmDialog
 *   title="Delete item?"
 *   description="This can't be undone."
 *   confirmLabel="Delete"
 *   destructive
 *   onConfirm={() => deleteItem.mutateAsync(id)}
 * >
 *   {(_, setOpen) => <Button onClick={() => setOpen(true)}>Delete</Button>}
 * </ConfirmDialog>
 *
 * For a trigger that can't be co-located with the dialog (e.g. one of N list
 * rows), drive it as a controlled component via `open` / `onOpenChange` instead
 * of the render-prop child.
 */
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in a destructive style. */
  destructive?: boolean;
  /**
   * Confirm handler. May be async — the confirm button shows a spinner while it
   * runs and the dialog closes automatically once it resolves. Throw/reject to
   * keep the dialog open.
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Render-prop trigger. Receives the dialog's open state + setter, so the
   * caller doesn't need its own `useState`.
   */
  children?: (open: boolean, setOpen: (open: boolean) => void) => ReactNode;
  /** Controlled open state. Omit to let the dialog manage its own (with `children`). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  children,
  open: openProp,
  onOpenChange,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await onConfirm();
      setOpen(false);
    } catch {
      // onConfirm is expected to surface its own error (e.g. a toast); keep the
      // dialog open so the user can retry or cancel.
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      {children?.(open, setOpen)}
      <Dialog
        open={open}
        // Block backdrop/escape dismissal while the confirm action is running.
        onOpenChange={(next) => {
          if (confirming) return;
          setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={confirming}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {confirmLabel}…
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
