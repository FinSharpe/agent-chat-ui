import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Banknote, BarChart3, Building2, FileText, Globe, Shield, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OtherInvestmentsFormData {
  // Basic Investment Information
  investmentType: string;
  customType: string;
  investmentName: string;
  symbol: string;
  isin: string;
  cusip: string;

  // Exchange and Geography
  exchange: string;
  exchangeCode: string;
  country: string;
  currency: string;
  geography: string;
  timeZone: string;

  // Purchase Details
  investmentDate: string;
  quantity: string;
  unit: string;
  purchasePrice: string;
  purchasePricePerUnit: string;
  totalInvestment: string;

  // Current Valuation
  currentValue: string;
  currentPricePerUnit: string;
  lastUpdated: string;
  unrealizedGainLoss: string;
  unrealizedGainLossPercent: string;

  // Trading Details
  broker: string;
  platform: string;
  accountNumber: string;
  folioNumber: string;
  dpId: string;
  clientId: string;

  // Investment Categorization
  assetClass: string;
  category: string;
  subCategory: string;
  sector: string;
  industryGroup: string;
  theme: string;

  // Risk and Performance
  riskLevel: string;
  riskRating: string;
  creditRating: string;
  performanceBenchmark: string;
  beta: string;

  // Bond/Fixed Income Specific
  faceValue: string;
  couponRate: string;
  interestRate: string;
  paymentFrequency: string;
  maturityDate: string;
  issuer: string;
  issuerType: string;
  callable: boolean;

  // Equity Specific
  marketCap: string;
  shareholdingPercentage: string;
  votingRights: boolean;
  dividendYield: string;

  // Alternative Investments
  fundManager: string;
  managementFee: string;
  performanceFee: string;
  lockInPeriod: string;
  minimumInvestment: string;

  // Tax and Legal
  taxStatus: string;
  taxBenefits: string;
  withholdingTax: string;
  kycCompliant: boolean;
  fatcaCompliant: boolean;

  // Regulatory and Compliance
  regulatoryBody: string;
  licenseNumber: string;
  prospectusAvailable: boolean;
  riskDisclosureRead: boolean;

  // Investment Strategy
  investmentObjective: string;
  investmentHorizon: string;
  targetPrice: string;
  stopLoss: string;
  rebalanceFrequency: string;

  // Documentation
  certificateNumber: string;
  physicalCertificate: boolean;
  nomineeDetails: boolean;

  // Monitoring and Alerts
  priceAlerts: boolean;
  maturityAlerts: boolean;
  performanceAlerts: boolean;
  newsAlerts: boolean;

  // Status and Activity
  isActive: boolean;
  isPledged: boolean;
  pledgedAmount: string;
  pledgedTo: string;

  // Fees and Charges
  brokerage: string;
  taxes: string;
  otherCharges: string;
  exitLoad: string;

  // Additional Information
  notes: string;
  riskFactors: string;
  keyFeatures: string;
}

interface OtherInvestmentsFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function OtherInvestmentsForm({ onSubmit, onCancel, initialData }: OtherInvestmentsFormProps) {
  const [formData, setFormData] = useState<OtherInvestmentsFormData>(initialData || {
    // Basic Investment Information
    investmentType: "",
    customType: "",
    investmentName: "",
    symbol: "",
    isin: "",
    cusip: "",
    
    // Exchange and Geography
    exchange: "",
    exchangeCode: "",
    country: "",
    currency: "INR",
    geography: "domestic",
    timeZone: "",
    
    // Purchase Details
    investmentDate: "",
    quantity: "",
    unit: "shares",
    purchasePrice: "",
    purchasePricePerUnit: "",
    totalInvestment: "",
    
    // Current Valuation
    currentValue: "",
    currentPricePerUnit: "",
    lastUpdated: "",
    unrealizedGainLoss: "",
    unrealizedGainLossPercent: "",
    
    // Trading Details
    broker: "",
    platform: "",
    accountNumber: "",
    folioNumber: "",
    dpId: "",
    clientId: "",
    
    // Investment Categorization
    assetClass: "",
    category: "",
    subCategory: "",
    sector: "",
    industryGroup: "",
    theme: "",
    
    // Risk and Performance
    riskLevel: "",
    riskRating: "",
    creditRating: "",
    performanceBenchmark: "",
    beta: "",
    
    // Bond/Fixed Income Specific
    faceValue: "",
    couponRate: "",
    interestRate: "",
    paymentFrequency: "",
    maturityDate: "",
    issuer: "",
    issuerType: "",
    callable: false,
    
    // Equity Specific
    marketCap: "",
    shareholdingPercentage: "",
    votingRights: true,
    dividendYield: "",
    
    // Alternative Investments
    fundManager: "",
    managementFee: "",
    performanceFee: "",
    lockInPeriod: "",
    minimumInvestment: "",
    
    // Tax and Legal
    taxStatus: "",
    taxBenefits: "",
    withholdingTax: "",
    kycCompliant: true,
    fatcaCompliant: false,
    
    // Regulatory and Compliance
    regulatoryBody: "",
    licenseNumber: "",
    prospectusAvailable: false,
    riskDisclosureRead: false,
    
    // Investment Strategy
    investmentObjective: "",
    investmentHorizon: "",
    targetPrice: "",
    stopLoss: "",
    rebalanceFrequency: "",
    
    // Documentation
    certificateNumber: "",
    physicalCertificate: false,
    nomineeDetails: false,
    
    // Monitoring and Alerts
    priceAlerts: true,
    maturityAlerts: false,
    performanceAlerts: true,
    newsAlerts: false,
    
    // Status and Activity
    isActive: true,
    isPledged: false,
    pledgedAmount: "",
    pledgedTo: "",
    
    // Fees and Charges
    brokerage: "",
    taxes: "",
    otherCharges: "",
    exitLoad: "",
    
    // Additional Information
    notes: "",
    riskFactors: "",
    keyFeatures: ""
  });

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-calculate per unit prices and gains/losses
  const calculateInvestmentMetrics = () => {
    const totalInvestment = parseFloat(formData.purchasePrice) || 0;
    const quantity = parseFloat(formData.quantity) || 0;
    const currentValue = parseFloat(formData.currentValue) || 0;
    
    if (totalInvestment > 0 && quantity > 0) {
      const pricePerUnit = (totalInvestment / quantity).toFixed(4);
      handleInputChange("purchasePricePerUnit", pricePerUnit);
    }
    
    if (currentValue > 0 && quantity > 0) {
      const currentPricePerUnit = (currentValue / quantity).toFixed(4);
      handleInputChange("currentPricePerUnit", currentPricePerUnit);
    }
    
    if (totalInvestment > 0 && currentValue > 0) {
      const gainLoss = currentValue - totalInvestment;
      const gainLossPercent = ((gainLoss / totalInvestment) * 100).toFixed(2);
      handleInputChange("unrealizedGainLoss", gainLoss.toFixed(2));
      handleInputChange("unrealizedGainLossPercent", gainLossPercent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.investmentType || !formData.investmentName || !formData.purchasePrice) {
      toast.error("Please fill in all required fields (Investment Type, Name, Purchase Price)");
      return;
    }

    // Validate purchase price
    if (parseFloat(formData.purchasePrice) <= 0) {
      toast.error("Purchase price must be greater than 0");
      return;
    }

    // Validate custom type if selected
    if (formData.investmentType === "other" && !formData.customType) {
      toast.error("Please specify custom investment type");
      return;
    }

    // Validate bond specific fields
    if ((formData.investmentType === "corporate-bonds" || formData.investmentType === "government-bonds") && 
        (!formData.couponRate || !formData.maturityDate)) {
      toast.error("Please fill in coupon rate and maturity date for bonds");
      return;
    }

    // Validate compliance for international investments
    if (formData.geography === "international" && !formData.fatcaCompliant) {
      toast.error("FATCA compliance is required for international investments");
      return;
    }

    onSubmit(formData);
    
    // Reset form to initial state
    setFormData({
      investmentType: "",
      customType: "",
      investmentName: "",
      symbol: "",
      isin: "",
      cusip: "",
      exchange: "",
      exchangeCode: "",
      country: "",
      currency: "INR",
      geography: "domestic",
      timeZone: "",
      investmentDate: "",
      quantity: "",
      unit: "shares",
      purchasePrice: "",
      purchasePricePerUnit: "",
      totalInvestment: "",
      currentValue: "",
      currentPricePerUnit: "",
      lastUpdated: "",
      unrealizedGainLoss: "",
      unrealizedGainLossPercent: "",
      broker: "",
      platform: "",
      accountNumber: "",
      folioNumber: "",
      dpId: "",
      clientId: "",
      assetClass: "",
      category: "",
      subCategory: "",
      sector: "",
      industryGroup: "",
      theme: "",
      riskLevel: "",
      riskRating: "",
      creditRating: "",
      performanceBenchmark: "",
      beta: "",
      faceValue: "",
      couponRate: "",
      interestRate: "",
      paymentFrequency: "",
      maturityDate: "",
      issuer: "",
      issuerType: "",
      callable: false,
      marketCap: "",
      shareholdingPercentage: "",
      votingRights: true,
      dividendYield: "",
      fundManager: "",
      managementFee: "",
      performanceFee: "",
      lockInPeriod: "",
      minimumInvestment: "",
      taxStatus: "",
      taxBenefits: "",
      withholdingTax: "",
      kycCompliant: true,
      fatcaCompliant: false,
      regulatoryBody: "",
      licenseNumber: "",
      prospectusAvailable: false,
      riskDisclosureRead: false,
      investmentObjective: "",
      investmentHorizon: "",
      targetPrice: "",
      stopLoss: "",
      rebalanceFrequency: "",
      certificateNumber: "",
      physicalCertificate: false,
      nomineeDetails: false,
      priceAlerts: true,
      maturityAlerts: false,
      performanceAlerts: true,
      newsAlerts: false,
      isActive: true,
      isPledged: false,
      pledgedAmount: "",
      pledgedTo: "",
      brokerage: "",
      taxes: "",
      otherCharges: "",
      exitLoad: "",
      notes: "",
      riskFactors: "",
      keyFeatures: ""
    });
  };

  const investmentTypes = [
    // Equity Investments
    { value: "unlisted-shares", label: "Unlisted Shares", category: "Equity", units: ["shares", "lots", "units"] },
    { value: "global-stocks", label: "Global/International Stocks", category: "Equity", units: ["shares", "units"] },
    { value: "private-equity", label: "Private Equity", category: "Equity", units: ["shares", "units", "stake"] },
    { value: "venture-capital", label: "Venture Capital", category: "Equity", units: ["shares", "units", "stake"] },
    { value: "startups", label: "Startup Investments", category: "Equity", units: ["shares", "equity-stake", "units"] },
    
    // Fixed Income
    { value: "corporate-bonds", label: "Corporate Bonds", category: "Fixed Income", units: ["bonds", "units", "face-value"] },
    { value: "government-bonds", label: "Government Bonds/G-Secs", category: "Fixed Income", units: ["bonds", "units", "face-value"] },
    { value: "municipal-bonds", label: "Municipal Bonds", category: "Fixed Income", units: ["bonds", "units", "face-value"] },
    { value: "international-bonds", label: "International Bonds", category: "Fixed Income", units: ["bonds", "units", "face-value"] },
    { value: "sovereign-bonds", label: "Sovereign Bonds", category: "Fixed Income", units: ["bonds", "units", "face-value"] },
    
    // Real Estate
    { value: "reits", label: "REITs (Real Estate Investment Trusts)", category: "Real Estate", units: ["units", "shares"] },
    { value: "invits", label: "InvITs (Infrastructure Investment Trusts)", category: "Real Estate", units: ["units", "shares"] },
    { value: "real-estate-funds", label: "Real Estate Funds", category: "Real Estate", units: ["units", "shares"] },
    
    // Alternative Investments
    { value: "hedge-funds", label: "Hedge Funds", category: "Alternative", units: ["units", "shares"] },
    { value: "structured-products", label: "Structured Products", category: "Alternative", units: ["units", "certificates"] },
    { value: "art-collectibles", label: "Art & Collectibles", category: "Alternative", units: ["pieces", "items", "lots"] },
    { value: "wine-investment", label: "Wine Investment", category: "Alternative", units: ["bottles", "cases", "lots"] },
    { value: "precious-stones", label: "Precious Stones/Gems", category: "Alternative", units: ["carats", "pieces", "lots"] },
    
    // Derivatives
    { value: "derivatives", label: "Derivatives (Options, Futures)", category: "Derivatives", units: ["contracts", "lots"] },
    { value: "warrants", label: "Warrants", category: "Derivatives", units: ["warrants", "units"] },
    { value: "convertible-bonds", label: "Convertible Bonds", category: "Derivatives", units: ["bonds", "units"] },
    
    // Digital Assets
    { value: "cryptocurrency", label: "Cryptocurrency", category: "Digital Assets", units: ["coins", "tokens", "units"] },
    { value: "nfts", label: "NFTs (Non-Fungible Tokens)", category: "Digital Assets", units: ["tokens", "pieces"] },
    { value: "digital-assets", label: "Other Digital Assets", category: "Digital Assets", units: ["tokens", "units"] },
    
    // Currency & Forex
    { value: "foreign-currency", label: "Foreign Currency", category: "Currency", units: ["units", "amount"] },
    { value: "currency-derivatives", label: "Currency Derivatives", category: "Currency", units: ["contracts", "lots"] },
    
    // Peer-to-Peer & Lending
    { value: "peer-to-peer", label: "Peer-to-Peer Lending", category: "Lending", units: ["loans", "units"] },
    { value: "invoice-discounting", label: "Invoice Discounting", category: "Lending", units: ["invoices", "units"] },
    { value: "trade-finance", label: "Trade Finance", category: "Lending", units: ["deals", "units"] },
    
    // Insurance Linked
    { value: "insurance-linked", label: "Insurance Linked Securities", category: "Insurance", units: ["units", "policies"] },
    { value: "catastrophe-bonds", label: "Catastrophe Bonds", category: "Insurance", units: ["bonds", "units"] },
    
    // Miscellaneous
    { value: "carbon-credits", label: "Carbon Credits", category: "Environmental", units: ["credits", "tonnes"] },
    { value: "water-rights", label: "Water Rights", category: "Environmental", units: ["rights", "units"] },
    { value: "intellectual-property", label: "Intellectual Property", category: "IP", units: ["patents", "rights", "licenses"] },
    
    // Custom
    { value: "other", label: "Other Alternative Investments", category: "Other", units: ["units", "shares", "pieces", "lots"] }
  ];

  const selectedType = investmentTypes.find(t => t.value === formData.investmentType);

  const currencyOptions = [
    "INR", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "SGD", "HKD", "CNY", "AED"
  ];

  const riskLevels = [
    { value: "very-low", label: "Very Low Risk" },
    { value: "low", label: "Low Risk" },
    { value: "moderate", label: "Moderate Risk" },
    { value: "high", label: "High Risk" },
    { value: "very-high", label: "Very High Risk" }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Investment Type */}
      <div>
        <Label>Investment Type *</Label>
        <Select value={formData.investmentType} onValueChange={(value) => {
          handleInputChange("investmentType", value);
          const investment = investmentTypes.find(t => t.value === value);
          if (investment) {
            handleInputChange("assetClass", investment.category);
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select investment type" />
          </SelectTrigger>
          <SelectContent>
            {["Equity", "Fixed Income", "Real Estate", "Alternative", "Derivatives", "Digital Assets", "Currency", "Lending", "Insurance", "Environmental", "IP", "Other"].map(category => (
              <div key={category}>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">{category}</div>
                {investmentTypes.filter(type => type.category === category).map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Investment Type */}
      {formData.investmentType === "other" && (
        <div>
          <Label>Custom Investment Type *</Label>
          <Input
            placeholder="Enter investment type"
            value={formData.customType}
            onChange={(e) => handleInputChange("customType", e.target.value)}
          />
        </div>
      )}

      {/* Investment Name and Identifiers */}
      <div className="space-y-3">
        <div>
          <Label>Investment Name *</Label>
          <Input
            placeholder="e.g., Apple Inc., Bitcoin, Oyo Rooms, etc."
            value={formData.investmentName}
            onChange={(e) => handleInputChange("investmentName", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Symbol/Ticker</Label>
            <Input
              placeholder="e.g., AAPL, BTC"
              value={formData.symbol}
              onChange={(e) => handleInputChange("symbol", e.target.value)}
            />
          </div>
          <div>
            <Label>ISIN</Label>
            <Input
              placeholder="International identifier"
              value={formData.isin}
              onChange={(e) => handleInputChange("isin", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Exchange and Geography */}
      <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Exchange & Geography
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Exchange/Platform</Label>
            <Input
              placeholder="e.g., NASDAQ, Binance"
              value={formData.exchange}
              onChange={(e) => handleInputChange("exchange", e.target.value)}
            />
          </div>
          <div>
            <Label>Exchange Code</Label>
            <Input
              placeholder="Exchange identifier"
              value={formData.exchangeCode}
              onChange={(e) => handleInputChange("exchangeCode", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Geography</Label>
          <RadioGroup
            value={formData.geography}
            onValueChange={(value) => handleInputChange("geography", value)}
            className="flex flex-row space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="domestic" id="domestic" />
              <Label htmlFor="domestic">Domestic</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="international" id="international" />
              <Label htmlFor="international">International</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.geography === "international" && (
          <div className="space-y-3 p-3 bg-white rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Country</Label>
                <Input
                  placeholder="e.g., USA, UK, Japan"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Time Zone</Label>
              <Select value={formData.timeZone} onValueChange={(value) => handleInputChange("timeZone", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                  <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                  <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                  <SelectItem value="CET">CET (Central European Time)</SelectItem>
                  <SelectItem value="JST">JST (Japan Standard Time)</SelectItem>
                  <SelectItem value="SGT">SGT (Singapore Time)</SelectItem>
                  <SelectItem value="HKT">HKT (Hong Kong Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fatcaCompliant"
                checked={formData.fatcaCompliant}
                onCheckedChange={(checked) => handleInputChange("fatcaCompliant", checked)}
              />
              <Label htmlFor="fatcaCompliant" className="text-sm">FATCA Compliant (Required for US investments)</Label>
            </div>
          </div>
        )}
      </div>

      {/* Purchase Details */}
      <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
          <Banknote className="w-4 h-4" />
          Purchase Details
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Investment Date</Label>
            <Input
              type="date"
              value={formData.investmentDate}
              onChange={(e) => handleInputChange("investmentDate", e.target.value)}
            />
          </div>
          <div>
            <Label>Purchase Price *</Label>
            <Input
              type="number"
              placeholder="Total amount invested"
              value={formData.purchasePrice}
              onChange={(e) => {
                handleInputChange("purchasePrice", e.target.value);
                setTimeout(calculateInvestmentMetrics, 100);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="Number of units"
              value={formData.quantity}
              onChange={(e) => {
                handleInputChange("quantity", e.target.value);
                setTimeout(calculateInvestmentMetrics, 100);
              }}
            />
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {selectedType?.units.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Purchase Price Per Unit</Label>
          <Input
            type="number"
            step="0.0001"
            placeholder="Price per unit"
            value={formData.purchasePricePerUnit}
            onChange={(e) => handleInputChange("purchasePricePerUnit", e.target.value)}
            className="bg-gray-50"
            readOnly
          />
        </div>
      </div>

      {/* Current Valuation */}
      <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Current Valuation
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Current Market Value</Label>
            <Input
              type="number"
              placeholder="Current total value"
              value={formData.currentValue}
              onChange={(e) => {
                handleInputChange("currentValue", e.target.value);
                setTimeout(calculateInvestmentMetrics, 100);
              }}
            />
          </div>
          <div>
            <Label>Current Price Per Unit</Label>
            <Input
              type="number"
              step="0.0001"
              placeholder="Current unit price"
              value={formData.currentPricePerUnit}
              onChange={(e) => handleInputChange("currentPricePerUnit", e.target.value)}
              className="bg-gray-50"
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Unrealized Gain/Loss</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Gain/Loss amount"
              value={formData.unrealizedGainLoss}
              onChange={(e) => handleInputChange("unrealizedGainLoss", e.target.value)}
              className="bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <Label>Gain/Loss (%)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="% Gain/Loss"
              value={formData.unrealizedGainLossPercent}
              onChange={(e) => handleInputChange("unrealizedGainLossPercent", e.target.value)}
              className="bg-gray-50"
              readOnly
            />
          </div>
        </div>

        <div>
          <Label>Last Updated</Label>
          <Input
            type="date"
            value={formData.lastUpdated}
            onChange={(e) => handleInputChange("lastUpdated", e.target.value)}
          />
        </div>
      </div>

      {/* Trading and Account Details */}
      <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Trading & Account Details
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Broker/Platform</Label>
            <Input
              placeholder="e.g., Zerodha, Charles Schwab"
              value={formData.broker}
              onChange={(e) => handleInputChange("broker", e.target.value)}
            />
          </div>
          <div>
            <Label>Account Number</Label>
            <Input
              placeholder="Trading account number"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange("accountNumber", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Folio Number</Label>
            <Input
              placeholder="Folio/Portfolio reference"
              value={formData.folioNumber}
              onChange={(e) => handleInputChange("folioNumber", e.target.value)}
            />
          </div>
          <div>
            <Label>DP ID</Label>
            <Input
              placeholder="Depository Participant ID"
              value={formData.dpId}
              onChange={(e) => handleInputChange("dpId", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bond/Fixed Income Specific Fields */}
      {(formData.investmentType.includes("bonds") || formData.investmentType.includes("structured")) && (
        <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Fixed Income Details
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Face Value</Label>
              <Input
                type="number"
                placeholder="Face value per bond"
                value={formData.faceValue}
                onChange={(e) => handleInputChange("faceValue", e.target.value)}
              />
            </div>
            <div>
              <Label>Coupon Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Annual coupon rate"
                value={formData.couponRate}
                onChange={(e) => handleInputChange("couponRate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Maturity Date</Label>
              <Input
                type="date"
                value={formData.maturityDate}
                onChange={(e) => handleInputChange("maturityDate", e.target.value)}
              />
            </div>
            <div>
              <Label>Payment Frequency</Label>
              <Select value={formData.paymentFrequency} onValueChange={(value) => handleInputChange("paymentFrequency", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Interest payment frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="at-maturity">At Maturity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Issuer</Label>
              <Input
                placeholder="Bond issuer name"
                value={formData.issuer}
                onChange={(e) => handleInputChange("issuer", e.target.value)}
              />
            </div>
            <div>
              <Label>Credit Rating</Label>
              <Input
                placeholder="e.g., AAA, AA+, A"
                value={formData.creditRating}
                onChange={(e) => handleInputChange("creditRating", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="callable"
              checked={formData.callable}
              onCheckedChange={(checked) => handleInputChange("callable", checked)}
            />
            <Label htmlFor="callable">Callable Bond</Label>
          </div>
        </div>
      )}

      {/* Equity Specific Fields */}
      {(formData.investmentType.includes("shares") || formData.investmentType.includes("equity") || formData.investmentType.includes("stocks")) && (
        <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Equity Details
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Market Cap Category</Label>
              <Select value={formData.marketCap} onValueChange={(value) => handleInputChange("marketCap", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Market cap category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="large-cap">Large Cap</SelectItem>
                  <SelectItem value="mid-cap">Mid Cap</SelectItem>
                  <SelectItem value="small-cap">Small Cap</SelectItem>
                  <SelectItem value="micro-cap">Micro Cap</SelectItem>
                  <SelectItem value="nano-cap">Nano Cap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shareholding %</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="Ownership percentage"
                value={formData.shareholdingPercentage}
                onChange={(e) => handleInputChange("shareholdingPercentage", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dividend Yield (%)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Annual dividend yield"
                value={formData.dividendYield}
                onChange={(e) => handleInputChange("dividendYield", e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="votingRights"
                checked={formData.votingRights}
                onCheckedChange={(checked) => handleInputChange("votingRights", checked)}
              />
              <Label htmlFor="votingRights">Voting Rights</Label>
            </div>
          </div>
        </div>
      )}

      {/* Investment Categorization */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Investment Categorization</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Sector</Label>
            <Select value={formData.sector} onValueChange={(value) => handleInputChange("sector", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="financial">Financial Services</SelectItem>
                <SelectItem value="consumer-discretionary">Consumer Discretionary</SelectItem>
                <SelectItem value="consumer-staples">Consumer Staples</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="industrials">Industrials</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="telecommunications">Telecommunications</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Theme</Label>
            <Input
              placeholder="Investment theme/strategy"
              value={formData.theme}
              onChange={(e) => handleInputChange("theme", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Risk Level</Label>
            <Select value={formData.riskLevel} onValueChange={(value) => handleInputChange("riskLevel", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Risk level" />
              </SelectTrigger>
              <SelectContent>
                {riskLevels.map((risk) => (
                  <SelectItem key={risk.value} value={risk.value}>
                    {risk.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Performance Benchmark</Label>
            <Input
              placeholder="e.g., S&P 500, Nifty 50"
              value={formData.performanceBenchmark}
              onChange={(e) => handleInputChange("performanceBenchmark", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Investment Strategy */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Investment Strategy</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Investment Objective</Label>
            <Select value={formData.investmentObjective} onValueChange={(value) => handleInputChange("investmentObjective", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Investment objective" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="capital-preservation">Capital Preservation</SelectItem>
                <SelectItem value="speculation">Speculation</SelectItem>
                <SelectItem value="diversification">Diversification</SelectItem>
                <SelectItem value="inflation-hedge">Inflation Hedge</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Investment Horizon</Label>
            <Select value={formData.investmentHorizon} onValueChange={(value) => handleInputChange("investmentHorizon", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Investment horizon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short-term">Short Term (&lt; 1 year)</SelectItem>
                <SelectItem value="medium-term">Medium Term (1-3 years)</SelectItem>
                <SelectItem value="long-term">Long Term (3-5 years)</SelectItem>
                <SelectItem value="very-long-term">Very Long Term (&gt; 5 years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Target Price</Label>
            <Input
              type="number"
              placeholder="Target selling price"
              value={formData.targetPrice}
              onChange={(e) => handleInputChange("targetPrice", e.target.value)}
            />
          </div>
          <div>
            <Label>Stop Loss</Label>
            <Input
              type="number"
              placeholder="Stop loss price"
              value={formData.stopLoss}
              onChange={(e) => handleInputChange("stopLoss", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Compliance and Tax */}
      <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Compliance & Tax
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tax Status</Label>
            <Select value={formData.taxStatus} onValueChange={(value) => handleInputChange("taxStatus", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tax treatment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="taxable">Taxable</SelectItem>
                <SelectItem value="tax-free">Tax Free</SelectItem>
                <SelectItem value="tax-deferred">Tax Deferred</SelectItem>
                <SelectItem value="ltcg">Long Term Capital Gains</SelectItem>
                <SelectItem value="stcg">Short Term Capital Gains</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Withholding Tax (%)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Tax withheld"
              value={formData.withholdingTax}
              onChange={(e) => handleInputChange("withholdingTax", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="kycCompliant"
              checked={formData.kycCompliant}
              onCheckedChange={(checked) => handleInputChange("kycCompliant", checked)}
            />
            <Label htmlFor="kycCompliant" className="text-sm">KYC Compliant</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="riskDisclosureRead"
              checked={formData.riskDisclosureRead}
              onCheckedChange={(checked) => handleInputChange("riskDisclosureRead", checked)}
            />
            <Label htmlFor="riskDisclosureRead" className="text-sm">Risk Disclosure Read</Label>
          </div>
        </div>
      </div>

      {/* Status and Activity */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Status & Activity</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
            />
            <Label htmlFor="isActive">Investment is Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPledged"
              checked={formData.isPledged}
              onCheckedChange={(checked) => handleInputChange("isPledged", checked)}
            />
            <Label htmlFor="isPledged">Pledged/Mortgaged</Label>
          </div>
        </div>

        {formData.isPledged && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pledged Amount</Label>
                <Input
                  type="number"
                  placeholder="Pledged value"
                  value={formData.pledgedAmount}
                  onChange={(e) => handleInputChange("pledgedAmount", e.target.value)}
                />
              </div>
              <div>
                <Label>Pledged To</Label>
                <Input
                  placeholder="Institution/person"
                  value={formData.pledgedTo}
                  onChange={(e) => handleInputChange("pledgedTo", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts and Monitoring */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Alerts & Monitoring</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="priceAlerts"
              checked={formData.priceAlerts}
              onCheckedChange={(checked) => handleInputChange("priceAlerts", checked)}
            />
            <Label htmlFor="priceAlerts" className="text-sm">Price Alerts</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="maturityAlerts"
              checked={formData.maturityAlerts}
              onCheckedChange={(checked) => handleInputChange("maturityAlerts", checked)}
            />
            <Label htmlFor="maturityAlerts" className="text-sm">Maturity Alerts</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="performanceAlerts"
              checked={formData.performanceAlerts}
              onCheckedChange={(checked) => handleInputChange("performanceAlerts", checked)}
            />
            <Label htmlFor="performanceAlerts" className="text-sm">Performance Alerts</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="newsAlerts"
              checked={formData.newsAlerts}
              onCheckedChange={(checked) => handleInputChange("newsAlerts", checked)}
            />
            <Label htmlFor="newsAlerts" className="text-sm">News Alerts</Label>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-3">
        <div>
          <Label>Key Features</Label>
          <Textarea
            placeholder="Key features and benefits of this investment"
            value={formData.keyFeatures}
            onChange={(e) => handleInputChange("keyFeatures", e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <Label>Risk Factors</Label>
          <Textarea
            placeholder="Key risks associated with this investment"
            value={formData.riskFactors}
            onChange={(e) => handleInputChange("riskFactors", e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <Label>Additional Notes</Label>
          <Textarea
            placeholder="Any additional information about this investment"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
          {initialData ? "Update Investment" : "Add Investment"}
        </Button>
      </div>
    </form>
  );
}