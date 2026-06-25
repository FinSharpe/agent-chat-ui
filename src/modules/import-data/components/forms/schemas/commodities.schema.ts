import { FormSchema } from "../shared/form-schema";

export const COMMODITIES_SCHEMA: FormSchema = {
  submitClassName: "bg-yellow-600 hover:bg-yellow-700",
  submitLabel: (isEdit) =>
    isEdit ? "Update Commodity Investment" : "Add Commodity Investment",
  initialValues: {
    // Basic Commodity Information
    commodityType: "",
    customCommodity: "",
    commodityCategory: "",
    holdingForm: "physical",

    // Purchase Details
    purchaseDate: "",
    quantity: "",
    unit: "",
    purchasePrice: "",
    purchasePricePerUnit: "",
    currentPrice: "",
    currentPricePerUnit: "",

    // Quality and Specifications
    purity: "",
    grade: "",
    brand: "",
    manufacturer: "",
    certificateNumber: "",
    hallmarkNumber: "",

    // Physical Holdings Details
    storageLocation: "",
    storageType: "",
    storageCharges: "",
    insuranceValue: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",

    // ETF/Digital Holdings Details
    platformName: "",
    folioNumber: "",
    dpId: "",
    clientId: "",
    isin: "",

    // Trading and Transaction Details
    brokerName: "",
    tradingAccount: "",
    exchangeName: "",
    contractDetails: "",
    marginRequired: "",

    // Valuation and Performance
    lastValuationDate: "",
    valuationMethod: "",
    marketPrice: "",
    unrealizedGainLoss: "",
    totalReturns: "",

    // Tax and Legal
    taxImplications: "",
    customsDuty: "",
    gstPaid: "",
    importDocuments: false,

    // Additional Features
    loanAgainst: false,
    loanAmount: "",
    loanProvider: "",
    pledged: false,
    pledgedAmount: "",
    pledgedTo: "",

    // Delivery and Logistics
    deliveryMode: "",
    deliveryAddress: "",
    trackingNumber: "",
    deliveryCharges: "",

    // Investment Strategy
    investmentPurpose: "",
    holdingPeriod: "",
    targetPrice: "",
    stopLoss: "",

    // Alerts and Monitoring
    priceAlerts: true,
    maturityAlerts: false,
    renewalDate: "",

    // Additional Information
    description: "",
  },
  validate: (v) => {
    if (parseFloat(v.quantity as string) <= 0)
      return "Quantity must be greater than 0";
    if (parseFloat(v.purchasePrice as string) <= 0)
      return "Purchase price must be greater than 0";
    if (v.commodityType === "other" && !v.customCommodity)
      return "Please enter commodity name for 'Other' type";
    if (v.holdingForm === "physical" && !v.storageType)
      return "Please specify storage type for physical holdings";
    if (
      (v.holdingForm === "etf" || v.holdingForm === "digital") &&
      !v.platformName
    )
      return "Please specify platform/fund name for ETF/digital holdings";
    return null;
  },
  sections: [
    // Commodity Type
    {
      rows: [
        {
          name: "commodityType",
          label: "Commodity Type",
          type: "select",
          required: true,
          placeholder: "Select commodity",
          options: [
            { value: "gold", label: "Gold" },
            { value: "silver", label: "Silver" },
            { value: "platinum", label: "Platinum" },
            { value: "palladium", label: "Palladium" },
            { value: "copper", label: "Copper" },
            { value: "aluminum", label: "Aluminum" },
            { value: "zinc", label: "Zinc" },
            { value: "nickel", label: "Nickel" },
            { value: "lead", label: "Lead" },
            { value: "crude-oil", label: "Crude Oil" },
            { value: "natural-gas", label: "Natural Gas" },
            { value: "coal", label: "Coal" },
            { value: "heating-oil", label: "Heating Oil" },
            { value: "wheat", label: "Wheat" },
            { value: "rice", label: "Rice" },
            { value: "corn", label: "Corn/Maize" },
            { value: "soybeans", label: "Soybeans" },
            { value: "sugar", label: "Sugar" },
            { value: "cotton", label: "Cotton" },
            { value: "coffee", label: "Coffee" },
            { value: "cocoa", label: "Cocoa" },
            { value: "live-cattle", label: "Live Cattle" },
            { value: "lean-hogs", label: "Lean Hogs" },
            { value: "rubber", label: "Rubber" },
            { value: "timber", label: "Timber/Lumber" },
            { value: "orange-juice", label: "Orange Juice" },
            { value: "other", label: "Other" },
          ],
        },
      ],
    },

    // Custom Commodity Name (only when "other")
    {
      visibleWhen: (v) => v.commodityType === "other",
      rows: [
        {
          name: "customCommodity",
          label: "Commodity Name",
          type: "text",
          required: true,
          placeholder: "Enter commodity name",
        },
      ],
    },

    // Holding Form (radio group -> select)
    {
      rows: [
        {
          name: "holdingForm",
          label: "Holding Form",
          type: "select",
          required: true,
          options: [
            { value: "physical", label: "Physical" },
            { value: "etf", label: "ETF/Fund" },
            { value: "digital", label: "Digital" },
            { value: "futures", label: "Futures" },
          ],
        },
      ],
    },

    // Purchase Details
    {
      title: "Purchase Details",
      tone: "yellow",
      rows: [
        [
          {
            name: "purchaseDate",
            label: "Purchase Date",
            type: "date",
          },
          {
            name: "purchasePrice",
            label: "Purchase Price",
            type: "number",
            required: true,
            placeholder: "₹ Total amount",
          },
        ],
        [
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            required: true,
            step: "0.001",
            placeholder: "Enter quantity",
            colSpan: 2,
          },
          {
            name: "unit",
            label: "Unit",
            type: "select",
            placeholder: "Unit",
            options: [
              { value: "grams", label: "grams" },
              { value: "kg", label: "kg" },
              { value: "ounces", label: "ounces" },
              { value: "tola", label: "tola" },
              { value: "troy-ounce", label: "troy ounce" },
              { value: "tonnes", label: "tonnes" },
              { value: "pounds", label: "pounds" },
              { value: "barrels", label: "barrels" },
              { value: "liters", label: "liters" },
              { value: "gallons", label: "gallons" },
              { value: "units", label: "units" },
              { value: "cubic-meters", label: "cubic meters" },
              { value: "MMBtu", label: "MMBtu" },
              { value: "metric-tons", label: "metric tons" },
              { value: "quintals", label: "quintals" },
              { value: "bushels", label: "bushels" },
              { value: "bags", label: "bags" },
              { value: "bales", label: "bales" },
              { value: "head", label: "head" },
              { value: "board-feet", label: "board feet" },
              { value: "pieces", label: "pieces" },
            ],
          },
        ],
        {
          name: "purchasePricePerUnit",
          label: "Purchase Price Per Unit",
          type: "number",
          step: "0.01",
          placeholder: "₹ Price per unit",
        },
      ],
    },

    // Current Valuation
    {
      title: "Current Valuation",
      tone: "green",
      rows: [
        [
          {
            name: "currentPrice",
            label: "Current Market Price",
            type: "number",
            placeholder: "₹ Current total value",
          },
          {
            name: "currentPricePerUnit",
            label: "Current Price Per Unit",
            type: "number",
            step: "0.01",
            placeholder: "₹ Current unit price",
          },
        ],
        [
          {
            name: "lastValuationDate",
            label: "Last Valuation Date",
            type: "date",
          },
          {
            name: "unrealizedGainLoss",
            label: "Unrealized Gain/Loss (%)",
            type: "number",
            step: "0.01",
            placeholder: "% Gain/Loss",
          },
        ],
      ],
    },

    // Quality & Specifications (title-only, no card)
    {
      title: "Quality & Specifications",
      rows: [
        [
          {
            name: "grade",
            label: "Grade/Quality",
            type: "text",
            placeholder: "Grade or quality specification",
          },
          {
            name: "brand",
            label: "Brand/Manufacturer",
            type: "text",
            placeholder: "e.g., MMTC-PAMP, Tanishq",
          },
        ],
      ],
    },

    // Purity & Hallmark (only for gold/silver/platinum)
    {
      visibleWhen: (v) =>
        v.commodityType === "gold" ||
        v.commodityType === "silver" ||
        v.commodityType === "platinum",
      rows: [
        [
          {
            name: "purity",
            label: "Purity",
            type: "select",
            placeholder: "Select purity",
            options: [
              { value: "24k", label: "24K (99.9%)" },
              { value: "22k", label: "22K (91.6%)" },
              { value: "18k", label: "18K (75%)" },
              { value: "916", label: "916 Hallmark" },
              { value: "999", label: "999 Fine Silver" },
              { value: "925", label: "925 Sterling Silver" },
              { value: "900", label: "900 Silver / 900 Platinum" },
              { value: "950", label: "950 Platinum" },
              { value: "850", label: "850 Platinum" },
              { value: "other", label: "Other" },
            ],
          },
          {
            name: "hallmarkNumber",
            label: "Hallmark/Certificate Number",
            type: "text",
            placeholder: "Certificate number",
          },
        ],
      ],
    },

    // Physical Storage Details (only physical)
    {
      title: "Physical Storage Details",
      tone: "blue",
      visibleWhen: (v) => v.holdingForm === "physical",
      rows: [
        [
          {
            name: "storageType",
            label: "Storage Type",
            type: "select",
            placeholder: "Select storage type",
            options: [
              { value: "home-safe", label: "Home Safe" },
              { value: "bank-locker", label: "Bank Locker" },
              { value: "vault-storage", label: "Professional Vault" },
              { value: "warehouse", label: "Warehouse" },
              { value: "depository", label: "Commodity Depository" },
              { value: "other", label: "Other" },
            ],
          },
          {
            name: "storageCharges",
            label: "Storage Charges (Annual)",
            type: "number",
            placeholder: "₹ Annual charges",
          },
        ],
        {
          name: "storageLocation",
          label: "Storage Location",
          type: "textarea",
          rows: 2,
          placeholder: "Detailed storage location/address",
        },
        [
          {
            name: "insuranceValue",
            label: "Insurance Value",
            type: "number",
            placeholder: "₹ Insured amount",
          },
          {
            name: "insuranceProvider",
            label: "Insurance Provider",
            type: "text",
            placeholder: "Insurance company",
          },
        ],
        {
          name: "insurancePolicyNumber",
          label: "Insurance Policy Number",
          type: "text",
          placeholder: "Policy number",
        },
      ],
    },

    // ETF/Digital Holdings Details (etf or digital)
    {
      title: "ETF/Digital Holdings Details",
      tone: "purple",
      visibleWhen: (v) =>
        v.holdingForm === "etf" || v.holdingForm === "digital",
      rows: [
        [
          {
            name: "platformName",
            label: "Platform/Fund Name",
            type: "text",
            placeholder: "e.g., Paytm Gold, HDFC Gold ETF",
          },
          {
            name: "folioNumber",
            label: "Folio/Account Number",
            type: "text",
            placeholder: "Account or folio number",
          },
        ],
        [
          {
            name: "dpId",
            label: "DP ID",
            type: "text",
            placeholder: "Depository Participant ID",
          },
          {
            name: "clientId",
            label: "Client ID",
            type: "text",
            placeholder: "Client ID",
          },
        ],
        {
          name: "isin",
          label: "ISIN",
          type: "text",
          placeholder: "International Securities Identification Number",
        },
      ],
    },

    // Futures Trading Details (futures)
    {
      title: "Futures Trading Details",
      tone: "orange",
      visibleWhen: (v) => v.holdingForm === "futures",
      rows: [
        [
          {
            name: "exchangeName",
            label: "Exchange Name",
            type: "select",
            placeholder: "Select exchange",
            options: [
              { value: "mcx", label: "MCX (Multi Commodity Exchange)" },
              { value: "ncdex", label: "NCDEX (National Commodity)" },
              { value: "icex", label: "ICEX (Indian Commodity Exchange)" },
              { value: "other", label: "Other" },
            ],
          },
          {
            name: "brokerName",
            label: "Broker Name",
            type: "text",
            placeholder: "Broker name",
          },
        ],
        [
          {
            name: "tradingAccount",
            label: "Trading Account",
            type: "text",
            placeholder: "Trading account number",
          },
          {
            name: "marginRequired",
            label: "Margin Required",
            type: "number",
            placeholder: "₹ Margin amount",
          },
        ],
        {
          name: "contractDetails",
          label: "Contract Details",
          type: "textarea",
          rows: 2,
          placeholder: "Contract specifications, expiry date, lot size, etc.",
        },
      ],
    },

    // Financing Options (title-only, no card)
    {
      title: "Financing Options",
      rows: [
        [
          {
            name: "loanAgainst",
            label: "Loan Against Commodity",
            type: "checkbox",
          },
          {
            name: "pledged",
            label: "Pledged/Mortgaged",
            type: "checkbox",
          },
        ],
      ],
    },

    // Loan details (only when loanAgainst)
    {
      tone: "gray",
      visibleWhen: (v) => v.loanAgainst === true,
      rows: [
        [
          {
            name: "loanAmount",
            label: "Loan Amount",
            type: "number",
            placeholder: "₹ Loan amount",
          },
          {
            name: "loanProvider",
            label: "Loan Provider",
            type: "text",
            placeholder: "Bank/NBFC name",
          },
        ],
      ],
    },

    // Pledge details (only when pledged)
    {
      tone: "gray",
      visibleWhen: (v) => v.pledged === true,
      rows: [
        [
          {
            name: "pledgedAmount",
            label: "Pledged Amount",
            type: "number",
            placeholder: "₹ Pledged value",
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

    // Investment Strategy (title-only, no card)
    {
      title: "Investment Strategy",
      rows: [
        [
          {
            name: "investmentPurpose",
            label: "Investment Purpose",
            type: "select",
            placeholder: "Investment purpose",
            options: [
              { value: "wealth-preservation", label: "Wealth Preservation" },
              { value: "inflation-hedge", label: "Inflation Hedge" },
              {
                value: "portfolio-diversification",
                label: "Portfolio Diversification",
              },
              { value: "speculation", label: "Speculation/Trading" },
              { value: "religious-cultural", label: "Religious/Cultural" },
              { value: "other", label: "Other" },
            ],
          },
          {
            name: "holdingPeriod",
            label: "Holding Period",
            type: "select",
            placeholder: "Expected holding period",
            options: [
              { value: "short-term", label: "Short Term (< 1 year)" },
              { value: "medium-term", label: "Medium Term (1-3 years)" },
              { value: "long-term", label: "Long Term (3-5 years)" },
              { value: "very-long-term", label: "Very Long Term (> 5 years)" },
              { value: "permanent", label: "Permanent/Legacy" },
            ],
          },
        ],
        [
          {
            name: "targetPrice",
            label: "Target Price",
            type: "number",
            placeholder: "₹ Target selling price",
          },
          {
            name: "stopLoss",
            label: "Stop Loss",
            type: "number",
            placeholder: "₹ Stop loss price",
          },
        ],
      ],
    },

    // Alerts & Monitoring (title-only, no card)
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
      ],
    },

    // Renewal date (only when maturityAlerts)
    {
      visibleWhen: (v) => v.maturityAlerts === true,
      rows: [
        {
          name: "renewalDate",
          label: "Renewal/Maturity Date",
          type: "date",
        },
      ],
    },

    // Tax & Documentation
    {
      title: "Tax & Documentation",
      tone: "red",
      rows: [
        [
          {
            name: "gstPaid",
            label: "GST Paid",
            type: "number",
            placeholder: "₹ GST amount",
          },
          {
            name: "customsDuty",
            label: "Customs Duty",
            type: "number",
            placeholder: "₹ Customs duty",
          },
        ],
        {
          name: "taxImplications",
          label: "Tax Implications",
          type: "textarea",
          rows: 2,
          placeholder: "Any specific tax considerations or implications",
        },
        {
          name: "importDocuments",
          label: "Import/Purchase documents available",
          type: "checkbox",
        },
      ],
    },

    // Additional Notes
    {
      rows: [
        {
          name: "description",
          label: "Additional Notes",
          type: "textarea",
          rows: 3,
          placeholder:
            "Any additional information about this commodity investment",
        },
      ],
    },
  ],
};
