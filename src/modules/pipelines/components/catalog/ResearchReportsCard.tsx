import { ArrowUpRight, FileSearch } from "lucide-react";
import Link from "next/link";

import { researchRoutes } from "../../constants/routes";

/**
 * The Discover page's way into the research section.
 *
 * Sits beside the custom-basket builder because it is the same kind of thing:
 * a product you commission, not a list you browse.
 */
export function ResearchReportsCard() {
  return (
    <Link
      href={researchRoutes.catalog}
      className="block"
    >
      <div className="group from-brand-gradient-from via-brand-gradient-via to-brand-gradient-to relative cursor-pointer rounded-xl border-2 border-transparent bg-gradient-to-r bg-clip-padding transition-all duration-300 hover:shadow-md active:scale-[0.98]">
        <div className="from-brand-border-from via-brand-border-via to-brand-border-to absolute inset-0 -z-10 rounded-xl bg-gradient-to-r opacity-60"></div>
        <div className="bg-bg-card relative rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="from-info-icon-bg to-brand-gradient-to group-hover:from-info-border group-hover:to-brand-border-via flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r transition-colors">
                <FileSearch className="text-accent-blue h-5 w-5" />
              </div>
              <div>
                <h3 className="text-text-primary font-medium">
                  Research Reports
                </h3>
                <p className="text-text-secondary text-sm">
                  Commission a full deep dive on any stock
                </p>
              </div>
            </div>
            <ArrowUpRight className="text-text-muted group-hover:text-accent-blue h-5 w-5 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
