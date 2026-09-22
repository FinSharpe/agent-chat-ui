import { Boxes, Coins, Home, Landmark, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { FormProps } from "../../types/import-data.types";
import type { ManualAssetCategory } from "../../store/useManualAssetsStore";
import type { FormValues } from "../forms/shared/form-schema";
import { CommoditiesForm } from "../forms/CommoditiesForm";
import { FixedDepositsForm } from "../forms/FixedDepositsForm";
import { InsuranceForm } from "../forms/InsuranceForm";
import { OtherInvestmentsForm } from "../forms/OtherInvestmentsForm";
import { RealEstateForm } from "../forms/RealEstateForm";
import { formatINRFull } from "../../utils/inr";

export interface ManualAssetConfig {
  id: ManualAssetCategory;
  title: string;
  description: string;
  icon: LucideIcon;
  /** FormModal header copy + emoji, unchanged from the previous page. */
  formDescription: string;
  formIcon: string;
  Form: ComponentType<FormProps<FormValues>>;
  /** Plural noun used in the chat prompt ("my fixed deposits"). */
  noun: string;
  /** Title / supporting line for one saved entry. */
  summarize: (data: FormValues) => { title: string; subtitle: string };
}

const str = (data: FormValues, key: string) =>
  typeof data[key] === "string" ? (data[key] as string).trim() : "";

/** Select values are stored as codes ("self-occupied"); show them as words. */
const humanize = (code: string) =>
  code ? code.charAt(0).toUpperCase() + code.slice(1).replace(/[-_]/g, " ") : "";

const join = (parts: (string | false | undefined)[], sep = " • ") =>
  parts.filter(Boolean).join(sep);

export const MANUAL_ASSETS: Record<ManualAssetCategory, ManualAssetConfig> = {
  fd: {
    id: "fd",
    title: "Fixed Deposits",
    description: "Connect bank FDs, corporate bonds, and term deposits",
    icon: Landmark,
    formDescription:
      "Add details about your fixed deposits including bank FDs, corporate bonds, and term deposits with comprehensive tracking features.",
    formIcon: "🏦",
    Form: FixedDepositsForm,
    noun: "fixed deposits",
    summarize: (d) => ({
      title: str(d, "bankName") || "Fixed Deposit",
      subtitle: join([
        formatINRFull(str(d, "principalAmount")),
        str(d, "interestRate") && `${str(d, "interestRate")}% p.a.`,
        str(d, "fdTenure") && `${str(d, "fdTenure")} ${str(d, "tenureUnit")}`,
      ]),
    }),
  },
  insurance: {
    id: "insurance",
    title: "Insurance",
    description: "Connect life, health, and general insurance policies",
    icon: ShieldCheck,
    formDescription:
      "Add details about your insurance policies including life, health, auto, home, travel, and other insurance coverage.",
    formIcon: "🛡️",
    Form: InsuranceForm,
    noun: "insurance policies",
    summarize: (d) => ({
      title: str(d, "policyName") || str(d, "insuranceCompany") || "Insurance Policy",
      subtitle: join([
        humanize(str(d, "insuranceType")),
        str(d, "sumAssured") && `${formatINRFull(str(d, "sumAssured"))} cover`,
      ]),
    }),
  },
  realestate: {
    id: "realestate",
    title: "Real Estate",
    description: "Add property details, rental income, and market valuations",
    icon: Home,
    formDescription:
      "Enter details about your property investments including residential, commercial, and land holdings.",
    formIcon: "🏠",
    Form: RealEstateForm,
    noun: "real estate holdings",
    summarize: (d) => ({
      title: str(d, "address") || humanize(str(d, "propertyType")) || "Property",
      subtitle: join([
        join([str(d, "city"), str(d, "state")], ", "),
        formatINRFull(str(d, "currentValue") || str(d, "purchasePrice")),
      ]),
    }),
  },
  commodities: {
    id: "commodities",
    title: "Commodities",
    description: "Connect gold, silver, and other commodity investments",
    icon: Coins,
    formDescription:
      "Add your commodity investments including gold, silver, and other precious metals or commodities.",
    formIcon: "🪙",
    Form: CommoditiesForm,
    noun: "commodity investments",
    summarize: (d) => ({
      title:
        str(d, "customCommodity") || humanize(str(d, "commodityType")) || "Commodity",
      subtitle: join([
        str(d, "quantity") && `${str(d, "quantity")} ${str(d, "unit")}`.trim(),
        formatINRFull(str(d, "purchasePrice")),
      ]),
    }),
  },
  other: {
    id: "other",
    title: "Other Investments",
    description:
      "Add unlisted shares, global stocks, crypto, bonds, and alternative investments",
    icon: Boxes,
    formDescription:
      "Add miscellaneous investments like unlisted shares, global stocks, cryptocurrency, bonds, and alternative investments.",
    formIcon: "🌐",
    Form: OtherInvestmentsForm,
    noun: "other investments",
    summarize: (d) => ({
      title:
        str(d, "investmentName") || humanize(str(d, "investmentType")) || "Investment",
      subtitle: join([
        humanize(str(d, "investmentType")),
        formatINRFull(str(d, "currentValue") || str(d, "purchasePrice")),
      ]),
    }),
  },
};

/** Chat prompt for "Analyse" on a manual asset row. */
export function manualAssetPrompt(
  config: ManualAssetConfig,
  entries: { data: FormValues }[],
) {
  const lines = entries.map((e) => {
    const { title, subtitle } = config.summarize(e.data);
    return `- ${title}${subtitle ? ` (${subtitle})` : ""}`;
  });
  return `Analyse my ${config.noun} and tell me how they fit my portfolio, what to watch and what to improve:\n${lines.join("\n")}`;
}
