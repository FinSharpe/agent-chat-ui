import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  CheckCircle2,
  Edit3,
  RefreshCcw,
  ScanSearch,
  Sliders,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";
import {
  ScannerApprovalInterrupt,
  isCustomScannerApprovalInterrupt,
} from "@/lib/scanner-approval-interrupt";
import { RelaxCriteriaModal } from "./scanner-approval-modals";
import { Textarea } from "@/components/ui/textarea";

// Reference chrome for the approval card's controls.
const SECTION_LABEL =
  "text-[9px] font-medium tracking-wider text-slate-400 uppercase";
const PRIMARY =
  "bg-brand-gradient flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[12px] font-medium text-white transition-all disabled:pointer-events-none disabled:opacity-50";
const MINT =
  "flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#DFF9EF] px-4 text-[12px] font-medium text-[#0A1F4D] transition-all disabled:pointer-events-none disabled:opacity-50";
const OUTLINE =
  "glass-card hover-tint flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[12px] font-medium text-[#0A1F4D] transition-colors disabled:pointer-events-none disabled:opacity-50";
const FIELD =
  "rounded-nested border-slate-100 bg-slate-50 text-[12px] text-[#0A1F4D] shadow-none focus-visible:border-[#063BAA]/30 focus-visible:ring-[#063BAA]/10 md:text-[12px]";

/** One key-metric style tile (StockAnalysisCard's "Key Metrics"). */
function DetailTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="glass-tile rounded-nested px-3.5 py-2.5">
      <p className="text-[9px] text-slate-400">{label}</p>
      <div className="mt-1 text-[11px] font-medium text-[#0A1F4D] tabular-nums">
        {value}
      </div>
    </div>
  );
}

interface ScannerApprovalInterruptProps {
  interrupt: ScannerApprovalInterrupt;
}

export function ScannerApprovalInterruptView({
  interrupt,
}: ScannerApprovalInterruptProps) {
  const thread = useStreamContext();
  const isCustomScanner = isCustomScannerApprovalInterrupt(interrupt);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRelaxModal, setShowRelaxModal] = useState(false);
  const [isEditingQuery, setIsEditingQuery] = useState(false);
  const [editedQuery, setEditedQuery] = useState(
    isCustomScanner ? interrupt.scanner_details.search_query : "",
  );

  // Form state for modify parameters
  const [pageNumber, setPageNumber] = useState(
    interrupt.scanner_details.page_number.toString(),
  );
  const [pageSize, setPageSize] = useState(
    interrupt.scanner_details.page_size.toString(),
  );
  const [segment, setSegment] = useState(
    isCustomScanner ? interrupt.scanner_details.segment : "0",
  );
  const [showOnlyLatestQuarterData, setShowOnlyLatestQuarterData] = useState(
    interrupt.scanner_details.show_only_latest_quarter_data,
  );

  const handleApprove = async () => {
    setLoading(true);
    try {
      thread.submit(
        {},
        {
          command: {
            resume: [
              {
                type: "response",
                args: { action: "approve" },
              },
            ],
          },
        },
      );
      toast.success("Scanner approved", {
        description: "The scanner execution has been approved.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error approving scanner:", error);
      toast.error("Error", {
        description: "Failed to approve scanner.",
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      thread.submit(
        {},
        {
          command: {
            resume: [
              {
                type: "response",
                args: { action: "cancel" },
              },
            ],
          },
        },
      );
      toast.info("Scanner cancelled", {
        description: "The scanner execution has been cancelled.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error cancelling scanner:", error);
      toast.error("Error", {
        description: "Failed to cancel scanner.",
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params: Record<string, any> = {
        page_number: parseInt(pageNumber, 10),
        page_size: parseInt(pageSize, 10),
        show_only_latest_quarter_data: showOnlyLatestQuarterData,
      };

      // Only include segment for custom scanners
      if (isCustomScanner) {
        params.segment = segment;
      }

      thread.submit(
        {},
        {
          command: {
            resume: [
              {
                type: "response",
                args: {
                  action: "modify",
                  params,
                },
              },
            ],
          },
        },
      );

      toast.success("Parameters modified", {
        description: "The scanner parameters have been updated.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error modifying scanner:", error);
      toast.error("Error", {
        description: "Failed to modify scanner parameters.",
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRelaxCriteria = async (feedback?: string) => {
    setLoading(true);
    try {
      const args: Record<string, any> = { action: "relax_criteria" };
      if (feedback) {
        args.feedback = feedback;
      }

      thread.submit(
        {},
        {
          command: {
            resume: [
              {
                type: "response",
                args,
              },
            ],
          },
        },
      );

      setShowRelaxModal(false);
      toast.success("Relaxing criteria", {
        description: "The system will generate a less restrictive query.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error relaxing criteria:", error);
      toast.error("Error", {
        description: "Failed to relax criteria.",
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuery = async () => {
    const trimmedQuery = editedQuery.trim();
    if (!trimmedQuery) {
      toast.error("Error", {
        description: "Query cannot be empty.",
        richColors: true,
        closeButton: true,
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      thread.submit(
        {},
        {
          command: {
            resume: [
              {
                type: "response",
                args: {
                  action: "edit_query",
                  query: trimmedQuery,
                },
              },
            ],
          },
        },
      );

      setIsEditingQuery(false);
      toast.success("Query updated", {
        description: "The scanner will use your modified query.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error editing query:", error);
      toast.error("Error", {
        description: "Failed to update query.",
        richColors: true,
        closeButton: true,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedQuery(
      isCustomScanner ? interrupt.scanner_details.search_query : "",
    );
    setIsEditingQuery(false);
  };

  return (
    <div className="glass-card rounded-card font-funnel mt-3 w-full space-y-4 p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]">
          <ScanSearch size={16} />
        </div>
        <div className="min-w-0">
          <span className="block text-[9px] font-medium tracking-wider text-slate-400 uppercase">
            Scanner approval
          </span>
          <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">
            Is this what you meant?
          </h3>
        </div>
      </div>

      {/* Message */}
      <p className="rounded-nested bg-[#063BAA]/6 px-4 py-3 text-[13px] leading-relaxed text-[#0A1F4D]">
        {interrupt.message}
      </p>

      {/* Scanner ID (for saved scanners) or Search Query (for custom scanners) */}
      {isCustomScanner ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={SECTION_LABEL}>Search query</span>
            {!isEditingQuery && (
              <button
                type="button"
                onClick={() => setIsEditingQuery(true)}
                disabled={loading}
                className="hover-tint flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium text-[#063BAA] transition-colors disabled:opacity-50"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>
          {isEditingQuery ? (
            <div className="space-y-2.5">
              <Textarea
                value={editedQuery}
                onChange={(e) => setEditedQuery(e.target.value)}
                rows={4}
                disabled={loading}
                className={cn(FIELD, "font-mono")}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className={OUTLINE}
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={PRIMARY}
                  onClick={handleEditQuery}
                  disabled={loading}
                >
                  Save & Run
                </button>
              </div>
            </div>
          ) : (
            <code className="glass-tile rounded-nested block px-3.5 py-2.5 font-mono text-[12px] leading-relaxed break-words text-[#0A1F4D]">
              {interrupt.scanner_details.search_query}
            </code>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <span className={SECTION_LABEL}>Scanner ID</span>
          <div className="glass-tile rounded-nested px-3.5 py-2.5 text-[13px] font-medium text-[#0A1F4D] tabular-nums">
            #{interrupt.scanner_details.scanner_id}
          </div>
        </div>
      )}

      {/* Scanner Details (Collapsible) */}
      <div className="overflow-hidden rounded-nested border border-slate-100">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover-tint flex w-full items-center justify-between px-4 py-3 text-[12px] font-medium text-[#0A1F4D] transition-colors"
        >
          <span>Scanner details</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3.5 px-4 pt-1 pb-4">
                {/* Group filter (custom scanners only) */}
                {isCustomScanner && interrupt.scanner_details.group && (
                  <div className="space-y-1">
                    <span className={SECTION_LABEL}>Group</span>
                    <p className="text-[12px] text-[#0A1F4D]">
                      {interrupt.scanner_details.group}
                    </p>
                  </div>
                )}

                {/* Sort (custom scanners only) */}
                {isCustomScanner && interrupt.scanner_details.sort && (
                  <div className="space-y-1">
                    <span className={SECTION_LABEL}>Sort</span>
                    <p className="text-[12px] text-[#0A1F4D]">
                      {interrupt.scanner_details.sort}
                    </p>
                  </div>
                )}

                {/* Fixed Columns (custom scanners only) */}
                {isCustomScanner && interrupt.scanner_details.fixed_columns && (
                  <div className="space-y-1.5">
                    <span className={SECTION_LABEL}>Extra columns</span>
                    <div className="flex flex-wrap gap-1.5">
                      {interrupt.scanner_details.fixed_columns
                        .split(",")
                        .map((col: string, idx: number) => (
                          <span
                            key={idx}
                            className="rounded-full bg-[#063BAA]/8 px-2 py-0.5 text-[10px] font-medium text-[#063BAA]"
                          >
                            {col.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Parameters Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <DetailTile
                    label="Page Number"
                    value={interrupt.scanner_details.page_number}
                  />
                  <DetailTile
                    label="Page Size"
                    value={interrupt.scanner_details.page_size}
                  />
                  {/* Segment (custom scanners only) */}
                  {isCustomScanner && (
                    <DetailTile
                      label="Segment"
                      value={interrupt.scanner_details.segment || "All"}
                    />
                  )}
                  <DetailTile
                    label="Latest Quarter Only"
                    value={
                      interrupt.scanner_details
                        .show_only_latest_quarter_data === "1"
                        ? "Yes"
                        : "No"
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={handleApprove}
          disabled={loading || showModifyForm}
          className={PRIMARY}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading || showModifyForm}
          className={MINT}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Retry
        </button>

        <button
          type="button"
          onClick={() => setShowRelaxModal(true)}
          disabled={loading}
          className={OUTLINE}
        >
          <Sliders className="h-3.5 w-3.5" />
          Relax Criteria
        </button>

        <button
          type="button"
          onClick={() => setShowModifyForm(!showModifyForm)}
          disabled={loading}
          className={cn(OUTLINE, "hidden")}
        >
          <Edit3 className="h-3.5 w-3.5" />
          {showModifyForm ? "Hide Modify Form" : "Modify Parameters"}
        </button>
      </div>

      {/* Modify Form */}
      <AnimatePresence initial={false}>
        {showModifyForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleModifySubmit}
              className="space-y-4 rounded-nested border border-slate-100 p-4"
            >
              <h4 className="font-geist text-xs font-medium text-[#0A1F4D]">
                Modify Scanner Parameters
              </h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Page Number */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="page_number"
                    className={SECTION_LABEL}
                  >
                    Page Number
                  </Label>
                  <Input
                    id="page_number"
                    type="number"
                    min="1"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    className={FIELD}
                  />
                </div>

                {/* Page Size */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="page_size"
                    className={SECTION_LABEL}
                  >
                    Page Size
                  </Label>
                  <Input
                    id="page_size"
                    type="number"
                    min="1"
                    max="1000"
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className={FIELD}
                  />
                </div>

                {/* Segment (custom scanners only) */}
                {isCustomScanner && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="segment"
                      className={SECTION_LABEL}
                    >
                      Segment
                    </Label>
                    <Input
                      id="segment"
                      type="text"
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                )}

                {/* Show Only Latest Quarter Data */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="latest_quarter"
                    className={SECTION_LABEL}
                  >
                    Latest Quarter Only
                  </Label>
                  <select
                    id="latest_quarter"
                    value={showOnlyLatestQuarterData}
                    onChange={(e) =>
                      setShowOnlyLatestQuarterData(e.target.value)
                    }
                    className="flex h-9 w-full rounded-nested border border-slate-100 bg-slate-50 px-3 py-1 text-[12px] text-[#0A1F4D] transition-colors focus-visible:ring-[3px] focus-visible:ring-[#063BAA]/10 focus-visible:outline-none"
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className={PRIMARY}
                  disabled={loading}
                >
                  Submit Modified Parameters
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <RelaxCriteriaModal
        open={showRelaxModal}
        onOpenChange={setShowRelaxModal}
        onSubmit={handleRelaxCriteria}
        loading={loading}
      />
    </div>
  );
}
