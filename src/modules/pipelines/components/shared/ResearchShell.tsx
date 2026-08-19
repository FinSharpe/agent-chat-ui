"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Page chrome shared by every research surface: one column width, one back
 * affordance, one place the title lives. The report page widens because eight
 * sections of charts need the room; everything else stays at the Discover
 * width so the section does not feel like a different product.
 *
 * `w-full` is load-bearing, not decoration: this box is a child of the app
 * layout's column flex container, and auto cross-axis margins suppress the
 * default stretch. Without it the box sizes to fit-content and `max-w-*` only
 * caps a width the content chose — so a screen showing skeletons, whose
 * `w-full` children contribute nothing intrinsic, collapses to the title and
 * re-centres. Same reason `history/page.tsx` carries it.
 */
export function ResearchShell({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  actions,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("mx-auto w-full pb-24", wide ? "max-w-6xl" : "max-w-5xl")}
    >
      <div className="space-y-6 p-6">
        {backHref && (
          <Link
            href={backHref}
            className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        )}

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-text-primary text-2xl font-semibold">
              {title}
            </h1>
            {subtitle && (
              <div className="text-text-secondary mt-1 text-sm">{subtitle}</div>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </header>

        {children}
      </div>
    </div>
  );
}
