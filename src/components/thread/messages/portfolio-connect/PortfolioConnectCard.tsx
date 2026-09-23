"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  portfolioConnectTarget,
  type PortfolioConnect,
} from "@/lib/portfolio-connect";
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";
import {
  AA_CONSENTS_KEY,
  CLASS_LABELS,
  ClassPickerDialog,
  ConnectAccountDialog,
  type AaConsentType,
} from "@/modules/import-data";
import { PortfolioConnectCardView } from "./PortfolioConnectCardView";

/** This thread, as a same-origin path the flow can carry and come back to. */
function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * The answer chat gives when a portfolio tool has nothing to read (#79, owner
 * ruling on finsharpe-mobile#169): a card that connects the missing accounts,
 * not a sentence apologising for them.
 *
 * The button runs the Import page's own consent flow in place — the class
 * picker and the mobile + PAN form — so the reader never leaves the thread to
 * start it. OneMoney's return still lands on Import, where the consent is
 * resolved; the journey carries this thread so the finished modal offers the
 * way back.
 */
export function PortfolioConnectCard({
  connect,
}: {
  connect: PortfolioConnect;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [connectType, setConnectType] = useState<AaConsentType | null>(null);

  const onAction = () => {
    const target = portfolioConnectTarget(connect);
    if (target.kind === "sign-in") {
      router.push(
        `${AUTH_ROUTES.login}?next=${encodeURIComponent(currentPath())}`,
      );
    } else if (target.kind === "class") {
      setConnectType(target.type);
    } else {
      setPickerOpen(true);
    }
  };

  return (
    <div className="animate-fade-in flex w-full items-start">
      <PortfolioConnectCardView
        connect={connect}
        onAction={onAction}
      />

      <ClassPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(type) => {
          setPickerOpen(false);
          setConnectType(type);
        }}
      />

      {connectType && (
        <ConnectAccountDialog
          type={connectType}
          open
          onOpenChange={(next) => !next && setConnectType(null)}
          returnTo={currentPath()}
          onLinked={() => {
            // An ACTIVE consent found by discovery links with no round trip.
            void queryClient.invalidateQueries({ queryKey: AA_CONSENTS_KEY });
            toast.success(
              `${CLASS_LABELS[connectType]} connected. Ask again to include them.`,
            );
          }}
        />
      )}
    </div>
  );
}
