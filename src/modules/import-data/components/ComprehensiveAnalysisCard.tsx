import { Sparkles } from "lucide-react";
import { ComprehensiveAnalysisModal } from "./modals/ComprehensiveAnalysisModal";

/**
 * Comprehensive Portfolio Analysis — the reference's CTA card around the
 * real analysis modal. The modal renders its own "Run Comprehensive
 * Analysis" trigger; import.css gives it the reference's full-width pill.
 */
export function ComprehensiveAnalysisCard() {
  return (
    <section className="glass-card space-y-3 rounded-card p-6">
      <div className="flex items-center gap-2">
        <Sparkles
          size={16}
          className="text-[#063BAA] dark:text-[#8FB4FF]"
        />
        <h3 className="font-geist text-forest-deep text-sm font-medium dark:text-white">
          Comprehensive Portfolio Analysis
        </h3>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Get a complete overview of your financial health across all connected
        accounts with AI-powered insights and personalized recommendations.
      </p>
      <div className="import-slot-cta">
        <ComprehensiveAnalysisModal />
      </div>
    </section>
  );
}
