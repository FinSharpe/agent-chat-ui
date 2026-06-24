import { FormSchema } from "../shared/form-schema";

export const OTHER_INVESTMENTS_SCHEMA: FormSchema = {
  submitClassName: "bg-orange-600 hover:bg-orange-700",
  submitLabel: (isEdit) => (isEdit ? "Update Investment" : "Add Investment"),
  initialValues: {
    // Basic Investment Information
    investmentType: "",
    customType: "",
    investmentName: "",
    symbol: "",
    isin: "",
    // Exchange and Geography
    exchange: "",
    exchangeCode: "",
    country: "",
    currency: "INR",
    geography: "domestic",
    timeZone: "",
    fatcaCompliant: false,
    // Purchase Details
    investmentDate: "",
    purchasePrice: "",
    quantity: "",
    unit: "shares",
    purchasePricePerUnit: "",
    // Current Valuation
    currentValue: "",
    currentPricePerUnit: "",
    unrealizedGainLoss: "",
    unrealizedGainLossPercent: "",
    lastUpdated: "",
    // Trading and Account Details
    broker: "",
    accountNumber: "",
    folioNumber: "",
    dpId: "",
    // Fixed Income Details
    faceValue: "",
    couponRate: "",
    maturityDate: "",
    paymentFrequency: "",
    issuer: "",
    creditRating: "",
    callable: false,
    // Equity Details
    marketCap: "",
    shareholdingPercentage: "",
    dividendYield: "",
    votingRights: true,
    // Investment Categorization
    sector: "",
    theme: "",
    riskLevel: "",
    performanceBenchmark: "",
    // Investment Strategy
    investmentObjective: "",
    investmentHorizon: "",
    targetPrice: "",
    stopLoss: "",
    // Compliance and Tax
    taxStatus: "",
    withholdingTax: "",
    kycCompliant: true,
    riskDisclosureRead: false,
    // Status and Activity
    isActive: true,
    isPledged: false,
    pledgedAmount: "",
    pledgedTo: "",
    // Alerts and Monitoring
    priceAlerts: true,
    maturityAlerts: false,
    performanceAlerts: true,
    newsAlerts: false,
    // Additional Information
    keyFeatures: "",
    riskFactors: "",
    notes: "",
  },
  validate: (v) => {
    if (parseFloat(v.purchasePrice as string) <= 0) {
      return "Purchase price must be greater than 0";
    }
    if (v.investmentType === "other" && !v.customType) {
      return "Please specify custom investment type";
    }
    if (
      (v.investmentType === "corporate-bonds" ||
        v.investmentType === "government-bonds") &&
      (!v.couponRate || !v.maturityDate)
    ) {
      return "Please fill in coupon rate and maturity date for bonds";
    }
    if (v.geography === "international" && !v.fatcaCompliant) {
      return "FATCA compliance is required for international investments";
    }
    return null;
  },
  sections: [
    // Investment Type
    {
      rows: [
        {
          name: "investmentType",
          label: "Investment Type",
          type: "select",
          required: true,
          placeholder: "Select investment type",
          options: [
            // Equity
            { value: "unlisted-shares", label: "Unlisted Shares" },
            { value: "global-stocks", label: "Global/International Stocks" },
            { value: "private-equity", label: "Private Equity" },
            { value: "venture-capital", label: "Venture Capital" },
            { value: "startups", label: "Startup Investments" },
            // Fixed Income
            { value: "corporate-bonds", label: "Corporate Bonds" },
            { value: "government-bonds", label: "Government Bonds/G-Secs" },
            { value: "municipal-bonds", label: "Municipal Bonds" },
            { value: "international-bonds", label: "International Bonds" },
            { value: "sovereign-bonds", label: "Sovereign Bonds" },
            // Real Estate
            { value: "reits", label: "REITs (Real Estate Investment Trusts)" },
            {
              value: "invits",
              label: "InvITs (Infrastructure Investment Trusts)",
            },
            { value: "real-estate-funds", label: "Real Estate Funds" },
            // Alternative
            { value: "hedge-funds", label: "Hedge Funds" },
            { value: "structured-products", label: "Structured Products" },
            { value: "art-collectibles", label: "Art & Collectibles" },
            { value: "wine-investment", label: "Wine Investment" },
            { value: "precious-stones", label: "Precious Stones/Gems" },
            // Derivatives
            { value: "derivatives", label: "Derivatives (Options, Futures)" },
            { value: "warrants", label: "Warrants" },
            { value: "convertible-bonds", label: "Convertible Bonds" },
            // Digital Assets
            { value: "cryptocurrency", label: "Cryptocurrency" },
            { value: "nfts", label: "NFTs (Non-Fungible Tokens)" },
            { value: "digital-assets", label: "Other Digital Assets" },
            // Currency
            { value: "foreign-currency", label: "Foreign Currency" },
            { value: "currency-derivatives", label: "Currency Derivatives" },
            // Lending
            { value: "peer-to-peer", label: "Peer-to-Peer Lending" },
            { value: "invoice-discounting", label: "Invoice Discounting" },
            { value: "trade-finance", label: "Trade Finance" },
            // Insurance
            { value: "insurance-linked", label: "Insurance Linked Securities" },
            { value: "catastrophe-bonds", label: "Catastrophe Bonds" },
            // Environmental
            { value: "carbon-credits", label: "Carbon Credits" },
            { value: "water-rights", label: "Water Rights" },
            // IP
            { value: "intellectual-property", label: "Intellectual Property" },
            // Other
            { value: "other", label: "Other Alternative Investments" },
          ],
        },
      ],
    },
    // Custom Investment Type (only when "other")
    {
      visibleWhen: (v) => v.investmentType === "other",
      rows: [
        {
          name: "customType",
          label: "Custom Investment Type",
          type: "text",
          required: true,
          placeholder: "Enter investment type",
        },
      ],
    },
    // Investment Name and Identifiers
    {
      rows: [
        {
          name: "investmentName",
          label: "Investment Name",
          type: "text",
          required: true,
          placeholder: "e.g., Apple Inc., Bitcoin, Oyo Rooms, etc.",
        },
        [
          {
            name: "symbol",
            label: "Symbol/Ticker",
            type: "text",
            placeholder: "e.g., AAPL, BTC",
          },
          {
            name: "isin",
            label: "ISIN",
            type: "text",
            placeholder: "International identifier",
          },
        ],
      ],
    },
    // Exchange & Geography
    {
      title: "Exchange & Geography",
      tone: "blue",
      rows: [
        [
          {
            name: "exchange",
            label: "Exchange/Platform",
            type: "text",
            placeholder: "e.g., NASDAQ, Binance",
          },
          {
            name: "exchangeCode",
            label: "Exchange Code",
            type: "text",
            placeholder: "Exchange identifier",
          },
        ],
        {
          name: "geography",
          label: "Geography",
          type: "select",
          options: [
            { value: "domestic", label: "Domestic" },
            { value: "international", label: "International" },
          ],
        },
      ],
    },
    // International-only details
    {
      visibleWhen: (v) => v.geography === "international",
      rows: [
        [
          {
            name: "country",
            label: "Country",
            type: "text",
            placeholder: "e.g., USA, UK, Japan",
          },
          {
            name: "currency",
            label: "Currency",
            type: "select",
            options: [
              { value: "INR", label: "INR" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
              { value: "GBP", label: "GBP" },
              { value: "JPY", label: "JPY" },
              { value: "CAD", label: "CAD" },
              { value: "AUD", label: "AUD" },
              { value: "CHF", label: "CHF" },
              { value: "SGD", label: "SGD" },
              { value: "HKD", label: "HKD" },
              { value: "CNY", label: "CNY" },
              { value: "AED", label: "AED" },
            ],
          },
        ],
        {
          name: "timeZone",
          label: "Time Zone",
          type: "select",
          placeholder: "Select time zone",
          options: [
            { value: "EST", label: "EST (Eastern Standard Time)" },
            { value: "PST", label: "PST (Pacific Standard Time)" },
            { value: "GMT", label: "GMT (Greenwich Mean Time)" },
            { value: "CET", label: "CET (Central European Time)" },
            { value: "JST", label: "JST (Japan Standard Time)" },
            { value: "SGT", label: "SGT (Singapore Time)" },
            { value: "HKT", label: "HKT (Hong Kong Time)" },
          ],
        },
        {
          name: "fatcaCompliant",
          label: "FATCA Compliant (Required for US investments)",
          type: "checkbox",
        },
      ],
    },
    // Purchase Details
    {
      title: "Purchase Details",
      tone: "green",
      rows: [
        [
          {
            name: "investmentDate",
            label: "Investment Date",
            type: "date",
          },
          {
            name: "purchasePrice",
            label: "Purchase Price",
            type: "number",
            required: true,
            placeholder: "Total amount invested",
          },
        ],
        [
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            step: "0.001",
            placeholder: "Number of units",
            colSpan: 2,
          },
          {
            name: "unit",
            label: "Unit",
            type: "text",
            placeholder: "Unit",
          },
        ],
        {
          name: "purchasePricePerUnit",
          label: "Purchase Price Per Unit",
          type: "number",
          step: "0.0001",
          placeholder: "Price per unit",
        },
      ],
    },
    // Current Valuation
    {
      title: "Current Valuation",
      tone: "purple",
      rows: [
        [
          {
            name: "currentValue",
            label: "Current Market Value",
            type: "number",
            placeholder: "Current total value",
          },
          {
            name: "currentPricePerUnit",
            label: "Current Price Per Unit",
            type: "number",
            step: "0.0001",
            placeholder: "Current unit price",
          },
        ],
        [
          {
            name: "unrealizedGainLoss",
            label: "Unrealized Gain/Loss",
            type: "number",
            step: "0.01",
            placeholder: "Gain/Loss amount",
          },
          {
            name: "unrealizedGainLossPercent",
            label: "Gain/Loss (%)",
            type: "number",
            step: "0.01",
            placeholder: "% Gain/Loss",
          },
        ],
        {
          name: "lastUpdated",
          label: "Last Updated",
          type: "date",
        },
      ],
    },
    // Trading & Account Details
    {
      title: "Trading & Account Details",
      tone: "yellow",
      rows: [
        [
          {
            name: "broker",
            label: "Broker/Platform",
            type: "text",
            placeholder: "e.g., Zerodha, Charles Schwab",
          },
          {
            name: "accountNumber",
            label: "Account Number",
            type: "text",
            placeholder: "Trading account number",
          },
        ],
        [
          {
            name: "folioNumber",
            label: "Folio Number",
            type: "text",
            placeholder: "Folio/Portfolio reference",
          },
          {
            name: "dpId",
            label: "DP ID",
            type: "text",
            placeholder: "Depository Participant ID",
          },
        ],
      ],
    },
    // Fixed Income Details (bonds or structured)
    {
      title: "Fixed Income Details",
      tone: "red",
      visibleWhen: (v) =>
        typeof v.investmentType === "string" &&
        (v.investmentType.includes("bonds") ||
          v.investmentType.includes("structured")),
      rows: [
        [
          {
            name: "faceValue",
            label: "Face Value",
            type: "number",
            placeholder: "Face value per bond",
          },
          {
            name: "couponRate",
            label: "Coupon Rate (%)",
            type: "number",
            step: "0.01",
            placeholder: "Annual coupon rate",
          },
        ],
        [
          {
            name: "maturityDate",
            label: "Maturity Date",
            type: "date",
          },
          {
            name: "paymentFrequency",
            label: "Payment Frequency",
            type: "select",
            placeholder: "Interest payment frequency",
            options: [
              { value: "monthly", label: "Monthly" },
              { value: "quarterly", label: "Quarterly" },
              { value: "semi-annual", label: "Semi-Annual" },
              { value: "annual", label: "Annual" },
              { value: "at-maturity", label: "At Maturity" },
            ],
          },
        ],
        [
          {
            name: "issuer",
            label: "Issuer",
            type: "text",
            placeholder: "Bond issuer name",
          },
          {
            name: "creditRating",
            label: "Credit Rating",
            type: "text",
            placeholder: "e.g., AAA, AA+, A",
          },
        ],
        {
          name: "callable",
          label: "Callable Bond",
          type: "checkbox",
        },
      ],
    },
    // Equity Details (shares / equity / stocks)
    {
      title: "Equity Details",
      tone: "green",
      visibleWhen: (v) =>
        typeof v.investmentType === "string" &&
        (v.investmentType.includes("shares") ||
          v.investmentType.includes("equity") ||
          v.investmentType.includes("stocks")),
      rows: [
        [
          {
            name: "marketCap",
            label: "Market Cap Category",
            type: "select",
            placeholder: "Market cap category",
            options: [
              { value: "large-cap", label: "Large Cap" },
              { value: "mid-cap", label: "Mid Cap" },
              { value: "small-cap", label: "Small Cap" },
              { value: "micro-cap", label: "Micro Cap" },
              { value: "nano-cap", label: "Nano Cap" },
            ],
          },
          {
            name: "shareholdingPercentage",
            label: "Shareholding %",
            type: "number",
            step: "0.001",
            placeholder: "Ownership percentage",
          },
        ],
        [
          {
            name: "dividendYield",
            label: "Dividend Yield (%)",
            type: "number",
            step: "0.01",
            placeholder: "Annual dividend yield",
          },
          {
            name: "votingRights",
            label: "Voting Rights",
            type: "checkbox",
          },
        ],
      ],
    },
    // Investment Categorization (titled, no card)
    {
      title: "Investment Categorization",
      rows: [
        [
          {
            name: "sector",
            label: "Sector",
            type: "select",
            placeholder: "Select sector",
            options: [
              { value: "technology", label: "Technology" },
              { value: "healthcare", label: "Healthcare" },
              { value: "financial", label: "Financial Services" },
              {
                value: "consumer-discretionary",
                label: "Consumer Discretionary",
              },
              { value: "consumer-staples", label: "Consumer Staples" },
              { value: "energy", label: "Energy" },
              { value: "materials", label: "Materials" },
              { value: "industrials", label: "Industrials" },
              { value: "real-estate", label: "Real Estate" },
              { value: "utilities", label: "Utilities" },
              { value: "telecommunications", label: "Telecommunications" },
              { value: "other", label: "Other" },
            ],
          },
          {
            name: "theme",
            label: "Theme",
            type: "text",
            placeholder: "Investment theme/strategy",
          },
        ],
        [
          {
            name: "riskLevel",
            label: "Risk Level",
            type: "select",
            placeholder: "Risk level",
            options: [
              { value: "very-low", label: "Very Low Risk" },
              { value: "low", label: "Low Risk" },
              { value: "moderate", label: "Moderate Risk" },
              { value: "high", label: "High Risk" },
              { value: "very-high", label: "Very High Risk" },
            ],
          },
          {
            name: "performanceBenchmark",
            label: "Performance Benchmark",
            type: "text",
            placeholder: "e.g., S&P 500, Nifty 50",
          },
        ],
      ],
    },
    // Investment Strategy (titled, no card)
    {
      title: "Investment Strategy",
      rows: [
        [
          {
            name: "investmentObjective",
            label: "Investment Objective",
            type: "select",
            placeholder: "Investment objective",
            options: [
              { value: "growth", label: "Growth" },
              { value: "income", label: "Income" },
              { value: "capital-preservation", label: "Capital Preservation" },
              { value: "speculation", label: "Speculation" },
              { value: "diversification", label: "Diversification" },
              { value: "inflation-hedge", label: "Inflation Hedge" },
            ],
          },
          {
            name: "investmentHorizon",
            label: "Investment Horizon",
            type: "select",
            placeholder: "Investment horizon",
            options: [
              { value: "short-term", label: "Short Term (< 1 year)" },
              { value: "medium-term", label: "Medium Term (1-3 years)" },
              { value: "long-term", label: "Long Term (3-5 years)" },
              { value: "very-long-term", label: "Very Long Term (> 5 years)" },
            ],
          },
        ],
        [
          {
            name: "targetPrice",
            label: "Target Price",
            type: "number",
            placeholder: "Target selling price",
          },
          {
            name: "stopLoss",
            label: "Stop Loss",
            type: "number",
            placeholder: "Stop loss price",
          },
        ],
      ],
    },
    // Compliance & Tax
    {
      title: "Compliance & Tax",
      tone: "orange",
      rows: [
        [
          {
            name: "taxStatus",
            label: "Tax Status",
            type: "select",
            placeholder: "Tax treatment",
            options: [
              { value: "taxable", label: "Taxable" },
              { value: "tax-free", label: "Tax Free" },
              { value: "tax-deferred", label: "Tax Deferred" },
              { value: "ltcg", label: "Long Term Capital Gains" },
              { value: "stcg", label: "Short Term Capital Gains" },
            ],
          },
          {
            name: "withholdingTax",
            label: "Withholding Tax (%)",
            type: "number",
            step: "0.01",
            placeholder: "Tax withheld",
          },
        ],
        [
          {
            name: "kycCompliant",
            label: "KYC Compliant",
            type: "checkbox",
          },
          {
            name: "riskDisclosureRead",
            label: "Risk Disclosure Read",
            type: "checkbox",
          },
        ],
      ],
    },
    // Status & Activity (titled, no card)
    {
      title: "Status & Activity",
      rows: [
        [
          {
            name: "isActive",
            label: "Investment is Active",
            type: "checkbox",
          },
          {
            name: "isPledged",
            label: "Pledged/Mortgaged",
            type: "checkbox",
          },
        ],
      ],
    },
    // Pledge details (only when pledged)
    {
      visibleWhen: (v) => v.isPledged === true,
      rows: [
        [
          {
            name: "pledgedAmount",
            label: "Pledged Amount",
            type: "number",
            placeholder: "Pledged value",
          },
          {
            name: "pledgedTo",
            label: "Pledged To",
            type: "text",
            placeholder: "Institution/person",
          },
        ],
      ],
    },
    // Alerts & Monitoring (titled, no card)
    {
      title: "Alerts & Monitoring",
      rows: [
        [
          {
            name: "priceAlerts",
            label: "Price Alerts",
            type: "checkbox",
          },
          {
            name: "maturityAlerts",
            label: "Maturity Alerts",
            type: "checkbox",
          },
        ],
        [
          {
            name: "performanceAlerts",
            label: "Performance Alerts",
            type: "checkbox",
          },
          {
            name: "newsAlerts",
            label: "News Alerts",
            type: "checkbox",
          },
        ],
      ],
    },
    // Additional Information (no title in source)
    {
      rows: [
        {
          name: "keyFeatures",
          label: "Key Features",
          type: "textarea",
          rows: 2,
          placeholder: "Key features and benefits of this investment",
        },
        {
          name: "riskFactors",
          label: "Risk Factors",
          type: "textarea",
          rows: 2,
          placeholder: "Key risks associated with this investment",
        },
        {
          name: "notes",
          label: "Additional Notes",
          type: "textarea",
          rows: 3,
          placeholder: "Any additional information about this investment",
        },
      ],
    },
  ],
};
