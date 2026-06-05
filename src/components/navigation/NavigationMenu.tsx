"use client";

import { cn } from "@/lib/utils";
import { Compass, Database, History, Plug, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/import", icon: Database, label: "Import", exact: false },
  { href: "/discover", icon: Compass, label: "Discover", exact: false },
  { href: "/history", icon: History, label: "Memory", exact: false },
  { href: "/settings/mcp", icon: Plug, label: "MCP Access", exact: false },
] as const;

/**
 * Navigation menu rendered inside the dark navy navigation drawer.
 * Mirrors the SideNavStrip's icons and active-route logic, expanded
 * into labelled glass rows with a prominent "New chat" call to action.
 */
export function NavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full flex-col gap-1 px-3">
      {/* Primary call to action */}
      <Link
        href="/"
        className="group relative mb-1 flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-sm font-medium text-white shadow-[0_6px_18px_-4px_rgba(37,99,235,0.6)] ring-1 ring-white/15 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_8px_24px_-4px_rgba(37,99,235,0.75)]"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 transition-transform group-hover:scale-105">
          <Plus className="size-4" />
        </span>
        New chat
      </Link>

      {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-white/[0.12] text-blue-100 shadow-[0_0_14px_rgba(59,130,246,0.18)] ring-1 ring-white/10"
                : "text-white/65 hover:bg-white/[0.07] hover:text-white",
            )}
          >
            <Icon
              className={cn(
                "size-[18px] transition-colors",
                isActive
                  ? "text-blue-300"
                  : "text-white/55 group-hover:text-white",
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
