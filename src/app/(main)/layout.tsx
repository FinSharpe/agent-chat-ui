import { ClientProviders } from "@/components/providers/ClientProviders";
import { AppShell, AppViewport } from "@/modules/shell";
import React from "react";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <React.Suspense fallback={null}>
      <ClientProviders>
        <AppViewport>
          <AppShell>{children}</AppShell>
        </AppViewport>
      </ClientProviders>
    </React.Suspense>
  );
}
