"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import FeatureHeader from "@/components/discover/FeatureHeader";
import { BASKET_WIZARD_STEPS } from "../../constants/basket-wizard-data";
import { useBasketBuilderContext } from "../../hooks/useBasketBuilderContext";
import { useMutualFundBasketBuilderContext } from "../../hooks/useMutualFundBasketBuilderContext";
import { useStockBasketBuilderContext } from "../../hooks/useStockBasketBuilderContext";
import { CategoryPreferenceStep } from "./mutual-fund/steps/CategoryPreferenceStep";
import { FundCategoriesStep } from "./mutual-fund/steps/FundCategoriesStep";
import { PlanTypeStep } from "./mutual-fund/steps/PlanTypeStep";
import { SchemeCountStep } from "./mutual-fund/steps/SchemeCountStep";
import { InvestmentStyleStep } from "./stock/steps/InvestmentStyleStep";
import { MarketCapStep } from "./stock/steps/MarketCapStep";
import { PortfolioAllocationStep } from "./stock/steps/PortfolioAllocationStep";
import { PortfolioSizeStep } from "./stock/steps/PortfolioSizeStep";
import { InvestmentTypeStep } from "./steps/InvestmentTypeStep";

const STOCK_STEPS = [
  InvestmentStyleStep,
  MarketCapStep,
  PortfolioSizeStep,
  PortfolioAllocationStep,
];
const FUND_STEPS = [
  PlanTypeStep,
  CategoryPreferenceStep,
  FundCategoriesStep,
  SchemeCountStep,
];

const FOOTER_BUTTON =
  "w-full text-white py-3.5 rounded-full font-medium text-xs uppercase tracking-wide hover:brightness-110 transition-all active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:brightness-100";

/**
 * The builder as the reference's five-step wizard: "Step X of 5" in the
 * header, a thin gradient progress bar, one question per step as option
 * cards, and a sticky Continue that becomes "Create My Basket" on the last.
 *
 * Step 1 chooses the flow; steps 2–5 are that flow's own four questions,
 * held in its provider. Going back to step 1 keeps both flows' answers, so
 * switching between stocks and funds never throws work away.
 */
export function BasketBuilderWizard() {
  const router = useRouter();
  const {
    investmentType,
    setInvestmentType,
    resetInvestmentType,
    selectedType,
  } = useBasketBuilderContext();
  const stock = useStockBasketBuilderContext();
  const fund = useMutualFundBasketBuilderContext();

  const flow =
    investmentType === "stocks"
      ? stock
      : investmentType === "mutualFunds"
        ? fund
        : null;
  const step = flow ? flow.currentStep + 1 : 1;
  const isLast = step === BASKET_WIZARD_STEPS;

  const fundSchemesValid = fund.basketConfig.fundCategories.every(
    (category) => category.schemesCount >= 1,
  );
  const canContinue = flow
    ? flow.canProceed() &&
      (investmentType !== "mutualFunds" || !isLast || fundSchemesValid)
    : !!selectedType;
  const isGenerating =
    investmentType === "stocks" ? stock.isGenerating : fund.isCreatingPortfolio;
  const error =
    investmentType === "stocks"
      ? stock.generationError
      : investmentType === "mutualFunds"
        ? fund.generationError
        : null;

  const Step = !flow
    ? InvestmentTypeStep
    : (investmentType === "stocks" ? STOCK_STEPS : FUND_STEPS)[
        flow.currentStep - 1
      ];

  const back = () => {
    if (!flow) router.push("/discover");
    else if (flow.currentStep === 1) resetInvestmentType();
    else flow.prevStep();
  };

  const next = () => {
    if (!canContinue) return;
    if (!flow) setInvestmentType(selectedType);
    else if (isLast) flow.handleComplete();
    else flow.nextStep();
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title="Custom Basket Builder"
        subtitle={`Step ${step} of ${BASKET_WIZARD_STEPS}`}
        onBack={back}
      />
      <div className="shrink-0 px-5 pt-3">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={BASKET_WIZARD_STEPS}
          aria-valuenow={step}
          aria-label="Basket builder progress"
        >
          <div
            className="bg-brand-gradient h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / BASKET_WIZARD_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto px-5 py-4 pb-[130px]">
        {Step && <Step />}
      </div>

      <div className="bg-background/80 mb-[76px] shrink-0 border-t border-slate-100 px-5 py-3 backdrop-blur-md">
        {error && (
          <p
            role="alert"
            className="mb-2.5 text-center text-[11px] text-rose-500"
          >
            {error}
          </p>
        )}
        {isLast ? (
          <button
            type="button"
            onClick={next}
            disabled={!canContinue || isGenerating}
            className={`${FOOTER_BUTTON} bg-[#0A9E6E]`}
          >
            {isGenerating ? (
              <>
                Creating Basket
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              </>
            ) : (
              <>
                Create My Basket
                <Check
                  size={15}
                  strokeWidth={3}
                />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={!canContinue}
            className={`${FOOTER_BUTTON} bg-brand-gradient`}
          >
            Continue <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
