"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import FeatureHeader from "@/components/discover/FeatureHeader";
import { cn } from "@/lib/utils";
import { researchRoutes } from "../../constants/routes";
import { useOwnedReports } from "../../hooks/usePipelineQueries";
import {
  HEADER_PILL,
  PRIMARY_BUTTON,
  Placeholder,
  SCROLL_BODY,
  StatStrip,
} from "../shared/kit";
import { ResearchPage } from "../shared/ResearchPage";
import { PurchaseRow } from "./PurchaseRow";

/**
 * The reports a user owns, as one divided card of rows — the same list
 * treatment as the workflow catalog.
 *
 * The row unit is the **Purchase**, because that is the only user-scoped
 * record — two purchases can attach to one content-keyed Run, and a Run has no
 * owner. Every state shows and is labelled: a published row opens its report,
 * an in-flight row deep-links back into the run screen the user lost, and a
 * refunded row stays as history rather than vanishing along with the evidence
 * of what happened.
 */
export function LibraryScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useOwnedReports();

  const inFlight =
    data?.filter(
      (row) => row.run_status === "queued" || row.run_status === "running",
    ).length ?? 0;
  const ready =
    data?.filter((row) => row.run_status === "published").length ?? 0;

  return (
    <ResearchPage>
      <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent">
        <FeatureHeader
          title="Your Reports"
          subtitle="Everything you have commissioned, runs in progress included"
          onBack={() => router.push(researchRoutes.catalog)}
          right={
            <button
              type="button"
              onClick={() => router.push(researchRoutes.catalog)}
              className={HEADER_PILL}
            >
              <Plus size={14} />
              New Report
            </button>
          }
        />

        <div className={`${SCROLL_BODY} space-y-6`}>
          {isLoading && (
            <div className="glass-card rounded-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800/60">
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="space-y-2.5 p-4.5"
                >
                  <Placeholder className="h-3 w-40" />
                  <Placeholder className="h-4 w-24" />
                  <Placeholder className="h-3 w-52" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-[11px] text-rose-500">
              Your reports could not be loaded.
            </p>
          )}

          {data && data.length === 0 && (
            <div className="space-y-4 py-12 text-center">
              <p className="text-[11px] text-slate-400">
                You have not commissioned a report yet.
              </p>
              <button
                type="button"
                onClick={() => router.push(researchRoutes.catalog)}
                className={cn(PRIMARY_BUTTON, "mx-auto w-fit px-6")}
              >
                Browse Agent Workflows
              </button>
            </div>
          )}

          {data && data.length > 0 && (
            <>
              <StatStrip
                stats={[
                  { label: "Reports", value: `${data.length}` },
                  { label: "Ready", value: `${ready}`, accent: ready > 0 },
                  { label: "In Progress", value: `${inFlight}` },
                ]}
              />
              <div className="glass-card rounded-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800/60">
                {data.map((row) => (
                  <PurchaseRow
                    key={row.purchase_id}
                    row={row}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ResearchPage>
  );
}
