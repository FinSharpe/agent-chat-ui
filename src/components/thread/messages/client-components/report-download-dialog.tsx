"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, Download, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export type ReportSection = {
  key: string;
  label: string;
};

interface ReportDownloadDialogProps {
  threadId: string | null;
  analysisId: string;
  sections: ReportSection[];
  /**
   * Tells /api/download-message which report template to render. The stock
   * report is the route's default and sends none.
   */
  analysisType?: string;
  /** File name without the `_analysis.pdf` suffix. */
  fileBaseName: string;
  triggerClassName?: string;
}

/**
 * The "Customize Report" dialog shared by the stock, fund and portfolio
 * analyses: pick sections, add a comment, download the rendered PDF.
 */
export function ReportDownloadDialog({
  threadId,
  analysisId,
  sections,
  analysisType,
  fileBaseName,
  triggerClassName,
}: ReportDownloadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(
    sections.map((s) => s.key),
  );
  const [personalComment, setPersonalComment] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/download-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: threadId,
          analysisId: analysisId,
          ...(analysisType ? { analysisType } : {}),
          selectedSections: selectedSections,
          personalComment: personalComment,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to generate PDF: ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${fileBaseName}_analysis.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    },
    onSuccess: () => {
      setOpen(false);
    },
    onError: (error: Error) => {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report", {
        description:
          error.message || "An unexpected error occurred. Please try again.",
      });
    },
  });

  const handleToggleSection = (sectionKey: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((key) => key !== sectionKey)
        : [...prev, sectionKey],
    );
  };

  const isAllSelected = selectedSections.length === sections.length;
  const isNoneSelected = selectedSections.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "bg-brand-gradient flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[12px] font-medium text-white transition-all",
            triggerClassName,
          )}
        >
          <Download size={14} />
          Download Report
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-card font-funnel max-h-[90vh] max-w-2xl gap-5 overflow-y-auto border-slate-100 bg-white p-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="font-geist text-base font-medium text-[#0A1F4D]">
            Customize Report
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            Select which sections to include in your PDF report and add a
            personal comment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Sections */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
                Report sections
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedSections(
                    isAllSelected ? [] : sections.map((s) => s.key),
                  )
                }
                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-[#063BAA] hover-tint"
              >
                {isAllSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sections.map((section) => {
                const isOn = selectedSections.includes(section.key);
                return (
                  <button
                    key={section.key}
                    type="button"
                    role="checkbox"
                    aria-checked={isOn}
                    onClick={() => handleToggleSection(section.key)}
                    className="glass-tile rounded-nested hover-tint flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors"
                  >
                    <span
                      className={cn(
                        "text-[11px]",
                        isOn
                          ? "font-medium text-[#0A1F4D]"
                          : "text-slate-500",
                      )}
                    >
                      {section.label}
                    </span>
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full transition-all",
                        isOn
                          ? "bg-[#063BAA] text-white"
                          : "border border-slate-200",
                      )}
                    >
                      {isOn && (
                        <Check
                          size={10}
                          strokeWidth={3.5}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Comment */}
          <div className="space-y-2">
            <label
              htmlFor={`personal-comment-${analysisId}`}
              className="text-[9px] font-medium tracking-wider text-slate-400 uppercase"
            >
              Personal comment (optional)
            </label>
            <Textarea
              id={`personal-comment-${analysisId}`}
              placeholder="Add your personal notes or comments to include in the report..."
              value={personalComment}
              onChange={(e) => setPersonalComment(e.target.value)}
              rows={4}
              className="rounded-nested resize-none border-slate-100 bg-white text-[12px] text-[#0A1F4D] shadow-none placeholder:text-slate-400 focus-visible:border-[#063BAA]/40 focus-visible:ring-0 md:text-[12px]"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          {mutation.error && (
            <div className="rounded-nested w-full bg-rose-500/10 p-3 text-rose-600">
              <p className="text-[11px] font-medium">Error generating PDF</p>
              <p className="mt-1 text-[10px]">{mutation.error.message}</p>
            </div>
          )}
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
              className="hover-tint h-9 rounded-full border border-slate-100 px-4 text-[12px] font-medium text-[#0A1F4D] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || isNoneSelected}
              className="bg-brand-gradient flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-medium text-white transition-all disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
