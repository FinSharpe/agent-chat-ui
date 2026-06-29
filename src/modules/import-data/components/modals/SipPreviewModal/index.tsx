/**
 * SIP Preview Modal - Container Component
 * Full-screen workspace presenting the read-only SIP registry (single column —
 * no analytics). Handles modal state, data fetching, and submission.
 */

"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import useModalState from "@/hooks/useModalState";
import { cn } from "@/lib/utils";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { FiDataErrorState } from "@/modules/import-data/components/shared/FiDataErrorState";
import {
  DataPanel,
  EmptyState,
  SectionLabel,
  TableSkeleton,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceSingle,
  formatCount,
  formatINRCompact,
  workspaceDialogContentClass,
  type WorkspaceMetric,
} from "@/modules/import-data/components/shared/ui";
import { SIP_COLUMNS } from "@/modules/import-data/types/sip";
import { BarChart3, Info, Loader2, Repeat } from "lucide-react";
import { useSipData } from "./hooks/useSipData";
import { useImportSipMutation } from "./hooks/useImportSipMutation";
import { SipHygieneStrip } from "./components/SipHygieneStrip";
import { SipAnalyticsDashboard } from "./components/SipAnalyticsDashboard";
import { SipLockedAnalytics } from "./components/SipLockedAnalytics";

/**
 * Modal component for SIP accounts preview
 * Allows users to review SIP registrations and import to chat
 */
export function SipPreviewModal({ consent }: BaseAnalysisModalProps) {
  const { open, handleClose, handleOpenChange } = useModalState();

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportSipMutation();

  // Fetch and transform SIP data
  const {
    displayData,
    hygiene,
    analytics,
    hasPerformanceData,
    isLoading,
    fiData,
    isError,
    errorKind,
    errorMessage,
  } = useSipData(consentID, !!isDataReady);

  const handleSubmit = () => {
    if (!fiData || fiData.length === 0) return;

    handleClose();

    // Call mutation to import SIPs to chat
    importMutation.mutate({ data: fiData });
  };

  const count = displayData.length;

  // Header strip leads with performance once it's available, otherwise the
  // registry/hygiene figures we can show from the Profile block today. Capped at
  // three so the strip stays on one line on mobile; the fourth figure ("Fund
  // houses" / "Invested") already lives as a tile in the body below.
  const hygieneMetrics: WorkspaceMetric[] = [
    { label: "Registrations", value: hygiene.registrations },
    {
      label: "KYC",
      value:
        hygiene.kycTotal > 0
          ? `${hygiene.kycCompliant}/${hygiene.kycTotal}`
          : "—",
      tone:
        hygiene.kycTotal > 0 && hygiene.kycCompliant === hygiene.kycTotal
          ? "positive"
          : "default",
    },
    { label: "Nominee gap", value: hygiene.nomineeGap },
  ];

  const performanceMetrics: WorkspaceMetric[] = analytics
    ? [
        {
          label: "Current value",
          value: formatINRCompact(analytics.totalCurrentValue),
          tone: "positive",
        },
        {
          label: "Returns",
          value:
            analytics.returnsPct === null
              ? "—"
              : `${analytics.returnsPct >= 0 ? "+" : ""}${analytics.returnsPct.toFixed(1)}%`,
          hint: "XIRR",
          tone:
            analytics.returnsPct === null
              ? "default"
              : analytics.returnsPct >= 0
                ? "positive"
                : "negative",
        },
        {
          label: "Monthly",
          value: formatINRCompact(analytics.monthlyCommitment),
          hint: "/mo",
        },
      ]
    : [];

  const metrics = hasPerformanceData ? performanceMetrics : hygieneMetrics;

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          disabled={!isDataReady}
        >
          <BarChart3 className="mr-1 h-3 w-3" />
          Analyse
        </Button>
      </DialogTrigger>
      <DialogContent className={workspaceDialogContentClass}>
        {isError ? (
          <>
            <WorkspaceHeader
              icon={Repeat}
              eyebrow="Import · SIP Registry"
              title="SIP Accounts"
              srDescription="Review your Systematic Investment Plan registrations"
            />
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
              <FiDataErrorState
                assetLabel="SIP registrations"
                errorKind={errorKind}
                message={errorMessage}
                consent={consent}
                onClose={handleClose}
              />
            </div>
          </>
        ) : (
          <>
            <WorkspaceHeader
              icon={Repeat}
              eyebrow="Import · SIP Registry"
              title="SIP Accounts"
              metrics={isLoading || count === 0 ? undefined : metrics}
              metricsSpread
              srDescription="Review your Systematic Investment Plan registrations"
            />

            <WorkspaceSingle className="max-w-none">
              {isLoading ? (
                <TableSkeleton rows={5} />
              ) : count === 0 ? (
                <EmptyState
                  icon={Repeat}
                  title="No SIP registrations found"
                  description="There are no active Systematic Investment Plans to preview for this connection."
                  className="border-border bg-card rounded-xl border border-dashed"
                />
              ) : (
                <>
                  <SipHygieneStrip hygiene={hygiene} />

                  {/* Info banner */}
                  <div className="border-info-border bg-info-bg text-info-foreground flex items-start gap-2.5 rounded-xl border p-3 text-sm">
                    <Info className="text-info-icon mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      SIP registrations show your active Systematic Investment
                      Plans across fund houses, including account identifiers
                      and registrar details fetched via the Account Aggregator
                      framework. Import them so the assistant can factor your
                      recurring commitments into planning.
                    </p>
                  </div>

                  {/* Registered SIP folios */}
                  <section>
                    <SectionLabel className="mb-2.5">
                      Registered SIP folios
                    </SectionLabel>

                    {/* Mobile: stacked cards instead of a horizontally-scrolling table. */}
                    <div className="flex flex-col gap-2.5 sm:hidden">
                      {displayData.map((row, index) => (
                        <div
                          key={index}
                          className="border-border bg-card flex flex-col gap-2 rounded-xl border p-3.5 shadow-sm"
                        >
                          <div className="text-text-primary text-sm font-semibold">
                            {row.fundHouse || "—"}
                          </div>
                          {row.maskedAccountNumber && (
                            <span className="bg-bg-subtle text-text-tertiary inline-flex w-fit items-center rounded px-1.5 py-0.5 font-mono text-[11px]">
                              {row.maskedAccountNumber}
                            </span>
                          )}
                          <dl className="mt-0.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                            <dt className="text-text-muted">Registrar</dt>
                            <dd className="text-text-secondary text-right">
                              {row.registrar || "—"}
                            </dd>
                            <dt className="text-text-muted">Holder</dt>
                            <dd className="text-text-secondary text-right">
                              {row.holderName || "—"}
                            </dd>
                          </dl>
                        </div>
                      ))}
                    </div>

                    {/* sm and up: the full registry table. */}
                    <DataPanel
                      noPadding
                      className="hidden sm:block"
                    >
                      <div className="scrollbar-thin overflow-auto">
                        <table className="w-full border-separate border-spacing-0 text-sm">
                          <thead className="sticky top-0 z-10">
                            <tr>
                              {SIP_COLUMNS.map((col) => (
                                <th
                                  key={col.key}
                                  className={cn(
                                    "border-border-subtle bg-bg-subtle text-text-tertiary border-b px-3 py-2.5 text-[11px] font-semibold tracking-[0.06em] uppercase",
                                    col.align === "right"
                                      ? "text-right"
                                      : col.align === "center"
                                        ? "text-center"
                                        : "text-left",
                                  )}
                                >
                                  {col.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {displayData.map((row, index) => (
                              <tr
                                key={index}
                                className="hover:bg-bg-hover transition-colors"
                              >
                                {SIP_COLUMNS.map((col) => {
                                  const value =
                                    row[col.key as keyof typeof row] || "—";
                                  const isAccount =
                                    col.key === "maskedAccountNumber";
                                  return (
                                    <td
                                      key={col.key}
                                      className={cn(
                                        "border-border-subtle border-b px-3 py-2.5 align-middle",
                                        col.key === "fundHouse"
                                          ? "text-text-primary font-medium"
                                          : "text-text-secondary",
                                        col.align === "right"
                                          ? "text-right"
                                          : col.align === "center"
                                            ? "text-center"
                                            : "text-left",
                                      )}
                                    >
                                      {isAccount && value !== "—" ? (
                                        <span className="bg-bg-subtle text-text-tertiary inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px]">
                                          {value}
                                        </span>
                                      ) : (
                                        value
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </DataPanel>
                  </section>

                  {/* Performance analytics — gated on Summary/Transactions. Shows
                      the locked placeholder today; the same slot renders the real
                      dashboard the moment the registrar shares the data. */}
                  <section>
                    <SectionLabel className="mb-2.5">
                      Performance analytics
                    </SectionLabel>
                    {hasPerformanceData && analytics ? (
                      <SipAnalyticsDashboard analytics={analytics} />
                    ) : (
                      <SipLockedAnalytics />
                    )}
                  </section>
                </>
              )}
            </WorkspaceSingle>

            <WorkspaceFooter
              start={count > 0 ? `${formatCount(count)} registrations` : null}
            >
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || count === 0 || importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  "Import to Chat"
                )}
              </Button>
            </WorkspaceFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
