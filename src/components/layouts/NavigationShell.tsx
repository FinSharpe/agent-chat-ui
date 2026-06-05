"use client";

import { NavigationMenu } from "@/components/navigation/NavigationMenu";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import appConfig from "@/configs/app.config";
import { cn } from "@/lib/utils";
import ThreadHistoryList from "@/modules/history/components/ThreadHistoryList";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { parseAsBoolean, useQueryState } from "nuqs";
import { ReactNode } from "react";

interface NavigationShellProps {
  children: ReactNode;
}

/**
 * Navigation shell that wraps all main app pages.
 *
 * The drawer is styled as a seamless expansion of the dark navy `SideNavStrip`
 * (`--primary-main-dark`) that triggers it: deep navy surface, an atmospheric
 * blue glow, a right-edge accent line mirroring the strip, glassy nav rows with
 * active-route glow, and dark-tuned chat history.
 */
export function NavigationShell({ children }: NavigationShellProps) {
  const [sidebarOpen, setSidebarOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  return (
    <>
      <Sheet
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      >
        <SheetContent
          side="left"
          className={cn(
            "flex w-[320px] flex-col gap-0 overflow-hidden border-none p-0 text-white",
            "bg-[#00004f] sm:max-w-[320px]",
            // Hide the primitive's default (light) close button — we render our own.
            "[&>button]:hidden",
          )}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          {/* Atmospheric depth: a soft blue glow + a right-edge accent line
              echoing the SideNavStrip the drawer expands from. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-28 left-1/2 h-64 w-72 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-teal-400/[0.06] blur-3xl" />
            <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-blue-500/40 to-transparent" />
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            {/* Header: logo + app name, with a dark close affordance */}
            <div className="flex items-center justify-between px-5 pt-6 pb-5">
              <Link
                href="/"
                className="group flex items-center gap-3"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 transition group-hover:bg-white/10">
                  <Image
                    src="/logo.png"
                    alt="logo"
                    width={22}
                    height={22}
                  />
                </span>
                <span className="text-lg font-semibold tracking-tight text-white">
                  {appConfig.appName}
                </span>
              </Link>

              <SheetClose className="flex size-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20">
                <X className="size-4" />
                <span className="sr-only">Close navigation</span>
              </SheetClose>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Navigation */}
            <div className="py-4">
              <NavigationMenu />
            </div>

            {/* Recent chats label */}
            <div className="px-5 pb-2">
              <span className="text-[11px] font-semibold tracking-wider text-white/35 uppercase">
                Recent chats
              </span>
            </div>

            {/* Chat history */}
            <div className="flex min-h-0 flex-1 flex-col px-3 pb-4">
              <ThreadHistoryList
                compact
                dark
                className="scrollbar-dark min-h-0 flex-1 overflow-y-auto pr-1 pb-4"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {children}
    </>
  );
}
