"use client";

import { useEffect, useState } from "react";
import SoftLoader from "@/components/SoftLoader";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { AppViewport } from "@/modules/shell";
import { AuthScreenTransition } from "./AuthScreenTransition";
import WebAuthShell from "./WebAuthShell";

/**
 * Frame for every sign-in screen. Desktop (≥1024px) is the split card: the
 * media card stays mounted and still while only the flow column on the right
 * animates between routes. Phones get each screen full-bleed, and the whole
 * screen transitions.
 */
export default function AuthFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const isDesktopWeb = useIsDesktopWeb();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // The layout (desktop split vs phone) is only known in the browser; show
    // the brand wave for that first paint rather than the wrong layout.
    return (
      <div className="flex min-h-screen w-full flex-col bg-white">
        <SoftLoader
          variant="wave"
          message="FinSharpeGPT"
        />
      </div>
    );
  }

  return (
    <AppViewport>
      {isDesktopWeb ? (
        <WebAuthShell>
          <AuthScreenTransition className="flex w-full flex-1 flex-col">
            {children}
          </AuthScreenTransition>
        </WebAuthShell>
      ) : (
        <AuthScreenTransition className="flex h-full w-full flex-col">
          {children}
        </AuthScreenTransition>
      )}
    </AppViewport>
  );
}
