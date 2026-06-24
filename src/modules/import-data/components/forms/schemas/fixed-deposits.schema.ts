import { FormSchema } from "../shared/form-schema";

export const FIXED_DEPOSITS_SCHEMA: FormSchema = {
  submitClassName: "bg-green-600 hover:bg-green-700",
  submitLabel: (isEdit) => (isEdit ? "Update Fixed Deposit" : "Add Fixed Deposit"),
  initialValues: {
    fdType: "",
    bankName: "",
    branchName: "",
    fdNumber: "",
    accountNumber: "",
    principalAmount: "",
    interestRate: "",
    compoundingFrequency: "quarterly",
    fdTenure: "",
    tenureUnit: "years",
    startDate: "",
    maturityDate: "",
    maturityAmount: "",
    interestPayoutMode: "",
    interestPayoutFrequency: "",
    interestPayoutAccount: "",
    cumulativeInterest: "",
    autoRenewal: false,
    renewalInstructions: "",
    renewalTenure: "",
    partialWithdrawal: false,
    minWithdrawalAmount: "",
    tdsDeducted: false,
    tdsRate: "",
    form15G_15H: false,
    taxSavingFD: false,
    section80C: "",
    nomineePresent: false,
    nomineeName: "",
    nomineeRelation: "",
    nomineeAge: "",
    nomineeShare: "",
    guardianName: "",
    prematurePenalty: "",
    loanAgainstFD: false,
    loanAmount: "",
    loanInterestRate: "",
    overdraftFacility: false,
    overdraftLimit: "",
    certificateType: "digital",
    certificateNumber: "",
    lockerLocation: "",
    linkedSavingsAccount: "",
    onlineAccess: true,
    mobileBanking: true,
    smsAlerts: true,
    emailStatements: true,
    seniorCitizenRate: false,
    specialRate: "",
    promotionalRate: false,
    rateType: "fixed",
    investmentPurpose: "",
    riskProfile: "low",
    contactPerson: "",
    relationshipManager: "",
    documentStatus: "",
    kycStatus: "completed",
    fdStatus: "active",
    maturityAlert: true,
    renewalAlert: true,
    interestCreditAlert: true,
    description: "",
  },
  validate: (v) => {
    if (Number(v.principalAmount) <= 0)
      return "Principal amount must be greater than 0";
    if (Number(v.interestRate) <= 0 || Number(v.interestRate) > 20)
      return "Please enter a valid interest rate between 0.1% and 20%";
    if (v.nomineePresent && (!v.nomineeName || !v.nomineeRelation))
      return "Please fill in nominee details";
    if (v.nomineePresent && parseInt(String(v.nomineeAge)) < 18 && !v.guardianName)
      return "Guardian name is required for minor nominee";
    return null;
  },
  sections: [
    // FD Type and Bank Information
    {
      rows: [
        {
          name: "fdType",
          label: "Fixed Deposit Type",
          type: "select",
          required: true,
          placeholder: "Select FD type",
          options: [
            { value: "regular", label: "Regular Fixed Deposit" },
            { value: "tax-saving", label: "Tax Saving FD (5 Years)" },
            { value: "senior-citizen", label: "Senior Citizen FD" },
            { value: "corporate", label: "Corporate Fixed Deposit" },
            { value: "cumulative", label: "Cumulative Fixed Deposit" },
            { value: "non-cumulative", label: "Non-Cumulative Fixed Deposit" },
            { value: "flexible", label: "Flexible Fixed Deposit" },
            { value: "special-tenure", label: "Special Tenure FD" },
          ],
        },
        [
          {
            name: "bankName",
            label: "Bank Name",
            type: "text",
            required: true,
            placeholder: "Bank name",
          },
          {
            name: "branchName",
            label: "Branch Name",
            type: "text",
            placeholder: "Branch name",
          },
        ],
        [
          {
            name: "fdNumber",
            label: "FD Number/Receipt Number",
            type: "text",
            placeholder: "FD receipt number",
          },
          {
            name: "accountNumber",
            label: "Linked Account Number",
            type: "text",
            placeholder: "Savings account number",
          },
        ],
      ],
    },
    // Investment Details (green card)
    {
      title: "Investment Details",
      tone: "green",
      rows: [
        [
          {
            name: "principalAmount",
            label: "Principal Amount",
            type: "number",
            required: true,
            placeholder: "₹ Investment amount",
          },
          {
            name: "interestRate",
            label: "Interest Rate (% p.a.)",
            type: "number",
            required: true,
            step: "0.01",
            placeholder: "Rate %",
          },
        ],
        {
          name: "compoundingFrequency",
          label: "Interest Compounding Frequency",
          type: "select",
          options: [
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "half-yearly", label: "Half-Yearly" },
            { value: "yearly", label: "Yearly" },
          ],
        },
        {
          name: "seniorCitizenRate",
          label: "Senior Citizen Rate (Additional 0.5%)",
          type: "checkbox",
        },
      ],
    },
    {
      tone: "green",
      visibleWhen: (v) => Boolean(v.seniorCitizenRate),
      rows: [
        {
          name: "specialRate",
          label: "Special Rate (% p.a.)",
          type: "number",
          step: "0.01",
          placeholder: "Special rate",
        },
      ],
    },
    // Maturity Details (blue card)
    {
      title: "Maturity Details",
      tone: "blue",
      rows: [
        [
          {
            name: "fdTenure",
            label: "FD Tenure",
            type: "number",
            required: true,
            placeholder: "Duration",
            colSpan: 2,
          },
          {
            name: "tenureUnit",
            label: "Unit",
            type: "select",
            options: [
              { value: "years", label: "Years" },
              { value: "months", label: "Months" },
            ],
          },
        ],
        [
          {
            name: "startDate",
            label: "Start Date",
            type: "date",
          },
          {
            name: "maturityDate",
            label: "Maturity Date",
            type: "date",
          },
        ],
        {
          name: "maturityAmount",
          label: "Estimated Maturity Amount",
          type: "number",
          placeholder: "₹ Maturity amount",
        },
      ],
    },
    // Interest Payout Options (plain header, no card)
    {
      title: "Interest Payout Options",
      rows: [
        {
          name: "interestPayoutMode",
          label: "Interest Payout Mode",
          type: "select",
          placeholder: "Select payout mode",
          options: [
            { value: "cumulative", label: "Cumulative (On Maturity)" },
            { value: "periodic", label: "Periodic Payout" },
            { value: "reinvest", label: "Auto Reinvestment" },
            { value: "transfer", label: "Transfer to Account" },
          ],
        },
      ],
    },
    {
      tone: "gray",
      visibleWhen: (v) => v.interestPayoutMode === "periodic",
      rows: [
        {
          name: "interestPayoutFrequency",
          label: "Payout Frequency",
          type: "select",
          placeholder: "Select frequency",
          options: [
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "half-yearly", label: "Half-Yearly" },
            { value: "yearly", label: "Yearly" },
          ],
        },
        {
          name: "interestPayoutAccount",
          label: "Interest Payout Account",
          type: "text",
          placeholder: "Account number for interest credit",
        },
      ],
    },
    // Auto Renewal
    {
      rows: [
        {
          name: "autoRenewal",
          label: "Auto-renewal on maturity",
          type: "checkbox",
        },
      ],
    },
    {
      title: "Auto-Renewal Settings",
      tone: "orange",
      visibleWhen: (v) => Boolean(v.autoRenewal),
      rows: [
        {
          name: "renewalInstructions",
          label: "Renewal Instructions",
          type: "select",
          placeholder: "Select renewal option",
          options: [
            { value: "principal-only", label: "Renew Principal Only" },
            { value: "principal-interest", label: "Renew Principal + Interest" },
            { value: "same-tenure", label: "Same Tenure" },
            { value: "different-tenure", label: "Different Tenure" },
            { value: "prevailing-rates", label: "At Prevailing Rates" },
          ],
        },
        {
          name: "renewalTenure",
          label: "Renewal Tenure (if different)",
          type: "text",
          placeholder: "Renewal tenure in years",
        },
      ],
    },
    // Tax Information (yellow card)
    {
      title: "Tax Information",
      tone: "yellow",
      rows: [
        {
          name: "taxSavingFD",
          label: "Tax Saving FD (Section 80C)",
          type: "checkbox",
        },
      ],
    },
    {
      tone: "yellow",
      visibleWhen: (v) => Boolean(v.taxSavingFD),
      rows: [
        {
          name: "section80C",
          label: "Section 80C Benefit Amount",
          type: "number",
          placeholder: "₹ Tax benefit amount",
        },
      ],
    },
    {
      tone: "yellow",
      rows: [
        [
          {
            name: "tdsDeducted",
            label: "TDS Deducted",
            type: "checkbox",
          },
          {
            name: "form15G_15H",
            label: "Form 15G/15H Submitted",
            type: "checkbox",
          },
        ],
      ],
    },
    {
      tone: "yellow",
      visibleWhen: (v) => Boolean(v.tdsDeducted),
      rows: [
        {
          name: "tdsRate",
          label: "TDS Rate (%)",
          type: "number",
          step: "0.01",
          placeholder: "TDS rate",
        },
      ],
    },
    // Nominee Information
    {
      rows: [
        {
          name: "nomineePresent",
          label: "Nominee details available",
          type: "checkbox",
        },
      ],
    },
    {
      title: "Nominee Details",
      tone: "gray",
      visibleWhen: (v) => Boolean(v.nomineePresent),
      rows: [
        [
          {
            name: "nomineeName",
            label: "Nominee Name",
            type: "text",
            placeholder: "Nominee full name",
          },
          {
            name: "nomineeRelation",
            label: "Relation",
            type: "text",
            placeholder: "Relationship",
          },
        ],
        [
          {
            name: "nomineeAge",
            label: "Nominee Age",
            type: "number",
            placeholder: "Age",
          },
          {
            name: "nomineeShare",
            label: "Share Percentage (%)",
            type: "number",
            placeholder: "Share %",
          },
        ],
      ],
    },
    {
      tone: "gray",
      visibleWhen: (v) =>
        Boolean(v.nomineePresent) && parseInt(String(v.nomineeAge)) < 18,
      rows: [
        {
          name: "guardianName",
          label: "Guardian Name (for minor nominee)",
          type: "text",
          placeholder: "Guardian full name",
        },
      ],
    },
    // Special Features & Services (plain header)
    {
      title: "Special Features & Services",
      rows: [
        [
          {
            name: "loanAgainstFD",
            label: "Loan Against FD",
            type: "checkbox",
          },
          {
            name: "overdraftFacility",
            label: "Overdraft Facility",
            type: "checkbox",
          },
        ],
        {
          name: "partialWithdrawal",
          label: "Partial withdrawal allowed",
          type: "checkbox",
        },
      ],
    },
    {
      visibleWhen: (v) => Boolean(v.partialWithdrawal),
      rows: [
        {
          name: "minWithdrawalAmount",
          label: "Minimum Withdrawal Amount",
          type: "number",
          placeholder: "₹ Minimum amount",
        },
      ],
    },
    // Digital Services (plain header)
    {
      title: "Digital Services",
      rows: [
        [
          {
            name: "onlineAccess",
            label: "Online Banking",
            type: "checkbox",
          },
          {
            name: "mobileBanking",
            label: "Mobile Banking",
            type: "checkbox",
          },
          {
            name: "smsAlerts",
            label: "SMS Alerts",
            type: "checkbox",
          },
          {
            name: "emailStatements",
            label: "Email Statements",
            type: "checkbox",
          },
        ],
      ],
    },
    // Alerts & Status (plain header)
    {
      title: "Alerts & Status",
      rows: [
        {
          name: "fdStatus",
          label: "FD Status",
          type: "select",
          options: [
            { value: "active", label: "Active" },
            { value: "matured", label: "Matured" },
            { value: "renewed", label: "Auto-Renewed" },
            { value: "closed", label: "Prematurely Closed" },
          ],
        },
        [
          {
            name: "maturityAlert",
            label: "Maturity Alert",
            type: "checkbox",
          },
          {
            name: "renewalAlert",
            label: "Renewal Alert",
            type: "checkbox",
          },
          {
            name: "interestCreditAlert",
            label: "Interest Credit Alert",
            type: "checkbox",
          },
        ],
      ],
    },
    // Additional Information
    {
      rows: [
        {
          name: "description",
          label: "Additional Notes",
          type: "textarea",
          rows: 2,
          placeholder: "Any additional information about the fixed deposit",
        },
      ],
    },
  ],
};
