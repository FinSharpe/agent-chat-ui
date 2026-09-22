"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, RefreshCw } from "lucide-react";
import { ScreenFooter } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";

/**
 * Error boundary for every signed-in page (T-10 item 1).
 *
 * It renders inside the app shell, so the sidebar, nav and history stay put
 * and only the page is replaced — a thrown render no longer blanks the whole
 * app with Next's default screen. Public pages (/welcome, /delete-account,
 * shared reports) are outside this route group and keep their own frame.
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();

  useEffect(() => {
    // The digest is all the server gives us in production; log the rest so a
    // developer looking at the console has something to go on.
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="font-funnel relative flex-1">
      <div className="scrollbar-none absolute inset-0 flex flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="bg-brand-gradient mb-5 flex h-14 w-14 items-center justify-center rounded-[18px]">
            <Image
              src="/logo/Finsharpe Logo - Icon - White.svg"
              alt=""
              width={26}
              height={26}
              className="h-[26px] w-[26px]"
            />
          </div>

          <h1 className="v3-display text-[26px] text-[#0A1F4D] dark:text-white">
            This page didn&rsquo;t load
          </h1>
          <p className="mt-2 max-w-[420px] text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            Something went wrong on our side. Nothing you did caused it, and
            nothing was lost — try again, or head back to your chat.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={reset}
              className="bg-brand-gradient flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11.5px] font-medium text-white transition-all hover:brightness-110 active:scale-98"
            >
              <RefreshCw size={13} />
              Try again
            </button>
            <Link
              href="/"
              className="hover-tint flex items-center gap-1.5 rounded-full border border-slate-100 px-5 py-2.5 text-[11.5px] font-medium text-[#0A1F4D] transition-colors dark:border-slate-800 dark:text-white"
            >
              <MessageSquare size={13} />
              Back to chat
            </Link>
          </div>

          {error.digest && (
            <p className="mt-5 text-[10px] tracking-wider text-slate-300 uppercase dark:text-slate-600">
              Ref {error.digest}
            </p>
          )}
        </div>

        <ScreenFooter wide={isDesktopWeb} />
      </div>
    </div>
  );
}
