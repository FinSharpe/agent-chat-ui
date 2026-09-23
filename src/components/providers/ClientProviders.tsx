"use client";

import { ReactNode } from "react";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider } from "@/providers/Stream";
import { Toaster } from "@/components/ui/sonner";

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers for thread and stream state management
 * The app shell (sidebar, nav, overlays) is added by MainLayout
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      <Toaster />
      <ThreadProvider>
        <StreamProvider>{children}</StreamProvider>
      </ThreadProvider>
    </>
  );
}
