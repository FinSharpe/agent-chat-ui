"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Compass, History, Menu, Plug, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import { UserMenu } from "./UserMenu";

const NAV_ITEMS = [
  { href: "/", icon: Plus, label: "New Chat", exact: true },
  { href: "/import", icon: Upload, label: "Import", exact: false },
  { href: "/discover", icon: Compass, label: "Discover", exact: false },
  { href: "/history", icon: History, label: "Memory", exact: false },
  { href: "/settings/mcp", icon: Plug, label: "MCP Access", exact: false },
] as const;

export function SideNavStrip() {
  const pathname = usePathname();
  const [, setSidebarOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  return (
    <div className="fixed left-0 top-0 z-10 hidden h-full w-[var(--side-navbar-width)] flex-col items-center justify-between bg-primary-main-dark py-5 md:flex">
      {/* Right-edge accent line */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-blue-800/0 via-blue-500/40 to-blue-800/0" />

      <div className="flex flex-col items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          className="mb-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Menu className="size-[22px]" />
        </Button>

        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={label}
                  className={
                    isActive
                      ? "bg-white/15 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)] backdrop-blur-sm hover:bg-white/20 hover:text-blue-300"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }
                  asChild
                >
                  <Link href={href}>
                    <Icon className="size-[22px]" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <UserMenu />
    </div>
  );
}
