export interface ImportMethodProps {
  icon: React.ElementType;
  title: string;
  description: string;
  status: "available" | "connected" | "pending";
  lastUpdated?: string;
  onConnect?: () => void;
  onAnalyse?: () => void;
  onRefresh?: () => void;
}

export interface CollapsibleInstructionsProps {
  title: string;
  description: string;
  icon: React.ElementType;
  bgColor: string;
  iconBgColor: string;
  textColor: string;
  iconColor: string;
  defaultExpanded?: boolean;
}

export interface FormProps<T = Record<string, unknown>> {
  onSubmit: (data: T) => void;
  onCancel: () => void;
  initialData?: T;
}

export type ManualInvestmentData =
  | FixedDeposit
  | RealEstate
  | Commodity
  | Insurance
  | OtherInvestment;

export interface EditingItem {
  type: string;
  index: number;
  data: ManualInvestmentData;
}

// Account-specific types for manual investments
export type FixedDeposit = {
  id: string;
  bankName: string;
  fdType: string;
  principalAmount: string;
  interestRate: string;
  fdTenure: string;
  tenureUnit: string;
  startDate?: string;
  maturityDate?: string;
  nominee?: string;
};

export type RealEstate = {
  id: string;
  propertyType: string;
  possession: string;
  city: string;
  state: string;
  purchasePrice: string;
  purchaseDate?: string;
  currentValue?: string;
  address?: string;
  area?: string;
};

export type Commodity = {
  id: string;
  commodityType: string;
  formType: string;
  quantity: string;
  unit: string;
  purchasePrice: string;
  purchaseDate?: string;
  currentPrice?: string;
  storageLocation?: string;
};

export type Insurance = {
  id: string;
  insuranceCompany: string;
  insuranceType: string;
  policyNumber: string;
  sumAssured: string;
  premiumAmount: string;
  premiumFrequency: string;
  startDate?: string;
  maturityDate?: string;
  nominee?: string;
};

export type OtherInvestment = {
  id: string;
  investmentType: string;
  assetClass: string;
  assetName: string;
  investmentAmount: string;
  purchaseDate?: string;
  currentValue?: string;
  notes?: string;
};
