import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, Edit3, RefreshCcw, Sliders, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-card-foreground">
            Is this what you meant?
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Message */}
        <div className="rounded-md bg-muted/30 p-3">
          <p className="text-sm text-foreground">{interrupt.message}</p>
        </div>

        {/* Scanner ID (for saved scanners) or Search Query (for custom scanners) */}
        {isCustomScanner ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">
                Search Query
              </h4>
              {!isEditingQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingQuery(true)}
                  disabled={loading}
                  className="h-7 px-2 text-xs"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {isEditingQuery ? (
              <div className="space-y-2">
                <Textarea
                  value={editedQuery}
                  onChange={(e) => setEditedQuery(e.target.value)}
                  rows={4}
                  disabled={loading}
                  className="font-mono text-sm bg-background"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEditQuery}
                    disabled={loading}
                  >
                    Save & Run
                  </Button>
                </div>
              </div>
            ) : (
              <code className="block rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground">
                {interrupt.scanner_details.search_query}
              </code>
            )}
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Scanner ID
            </h4>
            <div className="rounded-md bg-muted px-3 py-2 text-sm text-foreground font-medium">
              #{interrupt.scanner_details.scanner_id}
            </div>
          </div>
        )}

        {/* Scanner Details (Collapsible) */}
        <div className="border border-border rounded-md overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between bg-muted/30 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <span>Scanner Details</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
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
                <div className="p-3 space-y-3 bg-background">
                  {/* Group filter (custom scanners only) */}
                  {isCustomScanner && interrupt.scanner_details.group && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Group
                      </div>
                      <p className="text-sm text-foreground">
                        {interrupt.scanner_details.group}
                      </p>
                    </div>
                  )}

                  {/* Sort (custom scanners only) */}
                  {isCustomScanner && interrupt.scanner_details.sort && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Sort
                      </div>
                      <p className="text-sm text-foreground">
                        {interrupt.scanner_details.sort}
                      </p>
                    </div>
                  )}

                  {/* Fixed Columns (custom scanners only) */}
                  {isCustomScanner && interrupt.scanner_details.fixed_columns && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Extra Columns
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {interrupt.scanner_details.fixed_columns
                          .split(",")
                          .map((col: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                            >
                              {col.trim()}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Parameters Grid */}
                  <div
                    className={`grid grid-cols-2 gap-3 ${isCustomScanner ? "pt-2 border-t border-border" : ""}`}
                  >
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Page Number
                      </div>
                      <div className="text-sm text-foreground">
                        {interrupt.scanner_details.page_number}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Page Size
                      </div>
                      <div className="text-sm text-foreground">
                        {interrupt.scanner_details.page_size}
                      </div>
                    </div>
                    {/* Segment (custom scanners only) */}
                    {isCustomScanner && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Segment
                        </div>
                        <div className="text-sm text-foreground">
                          {interrupt.scanner_details.segment || "All"}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Latest Quarter Only
                      </div>
                      <div className="text-sm text-foreground">
                        {interrupt.scanner_details
                          .show_only_latest_quarter_data === "1"
                          ? "Yes"
                          : "No"}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={handleApprove}
            disabled={loading || showModifyForm}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>

          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={loading || showModifyForm}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowRelaxModal(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Sliders className="h-4 w-4" />
            Relax Criteria
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowModifyForm(!showModifyForm)}
            disabled={loading}
            className="items-center gap-2 hidden"
          >
            <Edit3 className="h-4 w-4" />
            {showModifyForm ? "Hide Modify Form" : "Modify Parameters"}
          </Button>
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
                className="border border-border rounded-md p-4 space-y-4 bg-muted/20"
              >
                <h4 className="text-sm font-semibold text-foreground">
                  Modify Scanner Parameters
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Page Number */}
                  <div className="space-y-2">
                    <Label htmlFor="page_number">Page Number</Label>
                    <Input
                      id="page_number"
                      type="number"
                      min="1"
                      value={pageNumber}
                      onChange={(e) => setPageNumber(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  {/* Page Size */}
                  <div className="space-y-2">
                    <Label htmlFor="page_size">Page Size</Label>
                    <Input
                      id="page_size"
                      type="number"
                      min="1"
                      max="1000"
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  {/* Segment (custom scanners only) */}
                  {isCustomScanner && (
                    <div className="space-y-2">
                      <Label htmlFor="segment">Segment</Label>
                      <Input
                        id="segment"
                        type="text"
                        value={segment}
                        onChange={(e) => setSegment(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  )}

                  {/* Show Only Latest Quarter Data */}
                  <div className="space-y-2">
                    <Label htmlFor="latest_quarter">
                      Latest Quarter Only
                    </Label>
                    <select
                      id="latest_quarter"
                      value={showOnlyLatestQuarterData}
                      onChange={(e) =>
                        setShowOnlyLatestQuarterData(e.target.value)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading}>
                    Submit Modified Parameters
                  </Button>
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
    </div>
  );
}
