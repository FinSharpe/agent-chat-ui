"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isHydratedUser, useAuth } from "@/providers/AuthProvider";
import { DELETE_ACCOUNT_PATH } from "../constants/content";
import DeleteAccountDialog from "./modals/DeleteAccountDialog";

interface DeleteAccountPanelProps {
  /** The page was reloaded right after a successful deletion. */
  justDeleted: boolean;
}

/**
 * The web path: a signed-in visitor deletes the account here. Everyone else
 * sees how to get to that point, so the page still works without a session.
 */
export default function DeleteAccountPanel({
  justDeleted,
}: DeleteAccountPanelProps) {
  const { user, isLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (justDeleted && !user && !isLoading) {
    return (
      <div
        role="status"
        className="flex items-start gap-3"
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-primary-main-dark font-medium">
            Your account has been deleted
          </p>
          <p className="text-text-secondary mt-1 text-sm">
            You are signed out of this browser. Any other device you were signed
            in on is signed out within 15 minutes.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="text-text-tertiary text-sm">
        Checking whether you are signed in…
      </p>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-text-secondary text-sm">
          Use FinSharpe on the web? Sign in, then come back to this page to
          delete your account here.
        </p>
        <Button
          asChild
          variant="outline"
          className="shrink-0"
        >
          <Link href={`/login?next=${encodeURIComponent(DELETE_ACCOUNT_PATH)}`}>
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  const email = isHydratedUser(user) ? user.email : null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-primary-main-dark text-sm font-medium">
          Signed in as {user.name || email || "you"}
        </p>
        {email && user.name && (
          <p className="text-text-tertiary truncate text-sm">{email}</p>
        )}
      </div>
      <Button
        variant="destructive"
        className="shrink-0"
        onClick={() => setDialogOpen(true)}
      >
        Delete account
      </Button>
      <DeleteAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
