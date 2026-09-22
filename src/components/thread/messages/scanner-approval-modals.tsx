import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface RelaxCriteriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback?: string) => void;
  loading: boolean;
}

export function RelaxCriteriaModal({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: RelaxCriteriaModalProps) {
  const [feedback, setFeedback] = useState("");

  // Reset feedback when modal closes
  useEffect(() => {
    if (!open) {
      setFeedback("");
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit(feedback.trim() || undefined);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* Reference popup: card surface, navy header row, round close. */}
      <DialogContent
        showCloseButton={false}
        className="glass-card rounded-card font-funnel gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <div className="flex h-[56px] items-center justify-between gap-3 border-b border-slate-50 px-5">
          <DialogTitle className="font-geist text-sm font-medium text-[#0A1F4D]">
            Relax Criteria
          </DialogTitle>
          <DialogClose
            className="hover-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </DialogClose>
        </div>

        <div className="space-y-3 p-5">
          <DialogDescription className="text-[12px] leading-relaxed text-slate-500">
            The system will generate a less restrictive query. You can
            optionally provide feedback to guide the relaxation.
          </DialogDescription>
          <Textarea
            placeholder="E.g., 'Allow higher P/E ratios', 'Include more sectors'..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            disabled={loading}
            className="rounded-nested border-slate-100 bg-slate-50 text-[12px] text-[#0A1F4D] shadow-none placeholder:text-slate-400 focus-visible:border-[#063BAA]/30 focus-visible:ring-[#063BAA]/10 md:text-[12px]"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="glass-card hover-tint flex h-9 items-center rounded-full px-4 text-[12px] font-medium text-[#0A1F4D] transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-brand-gradient flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-medium text-white transition-all disabled:pointer-events-none disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Relax Criteria
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
