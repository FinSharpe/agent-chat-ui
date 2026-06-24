import { FormSchema } from "../shared/form-schema";

export const INSURANCE_SCHEMA: FormSchema = {
  submitClassName: "bg-blue-600 hover:bg-blue-700",
  submitLabel: (isEdit) => (isEdit ? "Update Insurance Policy" : "Add Insurance Policy"),
  initialValues: {
    // Basic Policy Information
    insuranceType: "",
    insuranceCompany: "",
    policyNumber: "",
    policyName: "",
    sumAssured: "",
    annualPremium: "",
    premiumFrequency: "annual",
    policyStartDate: "",
    policyMaturityDate: "",
    policyTerm: "",
    // Life Insurance Specific
    lifeInsuranceType: "",
    bonusAmount: "",
    surrenderValue: "",
    loanAgainst: "",
    // Health Insurance Specific
    familyFloater: false,
    membersCount: "",
    membersDetails: "",
    copayPercentage: "",
    deductible: "",
    roomRentLimit: "",
    preMedicalCheckup: false,
    networkHospitals: "",
    // Auto Insurance Specific
    vehicleType: "",
    vehicleNumber: "",
    vehicleMake: "",
    vehicleModel: "",
    manufactureYear: "",
    coverageType: "",
    // Home Insurance Specific
    propertyValue: "",
    propertyType: "",
    propertyAddress: "",
    coverageItems: "",
    // Travel Insurance Specific
    destinationType: "",
    coverageDays: "",
    travelType: "",
    // Nominee Information
    nomineePresent: false,
    nomineeName: "",
    nomineeRelation: "",
    nomineeAge: "",
    nomineeShare: "",
    // Agent/Advisor Details
    hasAgent: false,
    agentName: "",
    agentContact: "",
    agentCode: "",
    // Claim History
    claimsMade: false,
    claimsCount: "",
    totalClaimsAmount: "",
    lastClaimDate: "",
    // Payment Details
    paymentMode: "",
    nextDueDate: "",
    // Additional Information
    isActive: true,
    renewalAlert: true,
    description: "",
  },
  validate: (v) => {
    if (v.insuranceType === "life" && !v.lifeInsuranceType) {
      return "Please select life insurance type";
    }
    if (v.insuranceType === "health" && v.familyFloater && !v.membersCount) {
      return "Please specify number of family members for family floater policy";
    }
    if (v.insuranceType === "auto" && (!v.vehicleNumber || !v.vehicleMake)) {
      return "Please enter vehicle number and make for auto insurance";
    }
    if (v.nomineePresent && (!v.nomineeName || !v.nomineeRelation)) {
      return "Please fill in nominee details";
    }
    return null;
  },
  sections: [
    // Insurance Type
    {
      rows: [
        {
          name: "insuranceType",
          label: "Insurance Type",
          type: "select",
          required: true,
          placeholder: "Select insurance type",
          options: [
            { value: "life", label: "Life Insurance" },
            { value: "health", label: "Health Insurance" },
            { value: "auto", label: "Auto/Vehicle Insurance" },
            { value: "home", label: "Home/Property Insurance" },
            { value: "travel", label: "Travel Insurance" },
            { value: "disability", label: "Disability Insurance" },
            { value: "critical-illness", label: "Critical Illness" },
            { value: "other", label: "Other" },
          ],
        },
      ],
    },
    // Basic Policy Information
    {
      rows: [
        [
          {
            name: "insuranceCompany",
            label: "Insurance Company",
            type: "text",
            required: true,
            placeholder: "Company name",
          },
          {
            name: "policyNumber",
            label: "Policy Number",
            type: "text",
            required: true,
            placeholder: "Policy number",
          },
        ],
        {
          name: "policyName",
          label: "Policy Name",
          type: "text",
          placeholder: "Policy/Plan name",
        },
        [
          {
            name: "sumAssured",
            label: "Sum Assured",
            type: "number",
            required: true,
            placeholder: "₹ Coverage amount",
          },
          {
            name: "annualPremium",
            label: "Annual Premium",
            type: "number",
            required: true,
            placeholder: "₹ Premium amount",
          },
        ],
        {
          name: "premiumFrequency",
          label: "Premium Frequency",
          type: "select",
          options: [
            { value: "annual", label: "Annual" },
            { value: "semi-annual", label: "Semi-Annual" },
            { value: "quarterly", label: "Quarterly" },
            { value: "monthly", label: "Monthly" },
            { value: "single", label: "Single Premium" },
          ],
        },
        [
          {
            name: "policyStartDate",
            label: "Policy Start Date",
            type: "date",
          },
          {
            name: "policyMaturityDate",
            label: "Policy Maturity Date",
            type: "date",
          },
        ],
        {
          name: "policyTerm",
          label: "Policy Term (Years)",
          type: "number",
          placeholder: "Policy duration in years",
        },
      ],
    },
    // Life Insurance Details
    {
      title: "Life Insurance Details",
      tone: "purple",
      visibleWhen: (v) => v.insuranceType === "life",
      rows: [
        {
          name: "lifeInsuranceType",
          label: "Life Insurance Type",
          type: "select",
          placeholder: "Select life insurance type",
          options: [
            { value: "term", label: "Term Life Insurance" },
            { value: "whole-life", label: "Whole Life Insurance" },
            { value: "endowment", label: "Endowment Policy" },
            { value: "ulip", label: "ULIP (Unit Linked)" },
            { value: "money-back", label: "Money Back Policy" },
            { value: "child-plan", label: "Child Insurance Plan" },
            { value: "pension", label: "Pension Plan" },
          ],
        },
        [
          {
            name: "bonusAmount",
            label: "Bonus Amount (if applicable)",
            type: "number",
            placeholder: "₹ Bonus amount",
          },
          {
            name: "surrenderValue",
            label: "Current Surrender Value",
            type: "number",
            placeholder: "₹ Surrender value",
          },
        ],
        {
          name: "loanAgainst",
          label: "Loan Against Policy",
          type: "number",
          placeholder: "₹ Loan amount (if any)",
        },
      ],
    },
    // Health Insurance Details
    {
      title: "Health Insurance Details",
      tone: "green",
      visibleWhen: (v) => v.insuranceType === "health",
      rows: [
        {
          name: "familyFloater",
          label: "Family Floater Policy",
          type: "checkbox",
        },
        {
          name: "membersCount",
          label: "Number of Family Members",
          type: "number",
          placeholder: "Total members covered",
        },
        {
          name: "membersDetails",
          label: "Family Members Details",
          type: "textarea",
          placeholder: "List family members covered (names, ages, relation)",
          rows: 2,
        },
        [
          {
            name: "copayPercentage",
            label: "Co-pay Percentage (%)",
            type: "number",
            placeholder: "Co-pay %",
          },
          {
            name: "deductible",
            label: "Deductible Amount",
            type: "number",
            placeholder: "₹ Deductible",
          },
        ],
        {
          name: "roomRentLimit",
          label: "Room Rent Limit (per day)",
          type: "number",
          placeholder: "₹ Room rent limit",
        },
        {
          name: "preMedicalCheckup",
          label: "Pre-medical checkup completed",
          type: "checkbox",
        },
        {
          name: "networkHospitals",
          label: "Network Hospitals Info",
          type: "text",
          placeholder: "Network hospital count or specific hospitals",
        },
      ],
    },
    // Auto Insurance Details
    {
      title: "Auto Insurance Details",
      tone: "blue",
      visibleWhen: (v) => v.insuranceType === "auto",
      rows: [
        {
          name: "vehicleType",
          label: "Vehicle Type",
          type: "select",
          placeholder: "Select vehicle type",
          options: [
            { value: "car", label: "Car" },
            { value: "bike", label: "Motorcycle/Scooter" },
            { value: "commercial", label: "Commercial Vehicle" },
            { value: "three-wheeler", label: "Three Wheeler" },
          ],
        },
        [
          {
            name: "vehicleNumber",
            label: "Vehicle Number",
            type: "text",
            placeholder: "Registration number",
          },
          {
            name: "manufactureYear",
            label: "Manufacturing Year",
            type: "number",
            placeholder: "Year",
          },
        ],
        [
          {
            name: "vehicleMake",
            label: "Vehicle Make",
            type: "text",
            placeholder: "e.g., Maruti, Honda, Bajaj",
          },
          {
            name: "vehicleModel",
            label: "Vehicle Model",
            type: "text",
            placeholder: "Model name",
          },
        ],
        {
          name: "coverageType",
          label: "Coverage Type",
          type: "select",
          placeholder: "Select coverage type",
          options: [
            { value: "comprehensive", label: "Comprehensive" },
            { value: "third-party", label: "Third Party Only" },
            { value: "own-damage", label: "Own Damage" },
          ],
        },
      ],
    },
    // Home Insurance Details
    {
      title: "Home Insurance Details",
      tone: "orange",
      visibleWhen: (v) => v.insuranceType === "home",
      rows: [
        [
          {
            name: "propertyValue",
            label: "Property Value",
            type: "number",
            placeholder: "₹ Property value",
          },
          {
            name: "propertyType",
            label: "Property Type",
            type: "select",
            placeholder: "Property type",
            options: [
              { value: "apartment", label: "Apartment" },
              { value: "independent-house", label: "Independent House" },
              { value: "villa", label: "Villa" },
              { value: "office", label: "Office" },
              { value: "shop", label: "Shop/Commercial" },
            ],
          },
        ],
        {
          name: "propertyAddress",
          label: "Property Address",
          type: "textarea",
          placeholder: "Property address",
          rows: 2,
        },
        {
          name: "coverageItems",
          label: "Coverage Items",
          type: "textarea",
          placeholder: "Items/risks covered (fire, theft, natural disasters, contents, etc.)",
          rows: 2,
        },
      ],
    },
    // Travel Insurance Details
    {
      title: "Travel Insurance Details",
      tone: "blue",
      visibleWhen: (v) => v.insuranceType === "travel",
      rows: [
        [
          {
            name: "destinationType",
            label: "Destination Type",
            type: "select",
            placeholder: "Select destination",
            options: [
              { value: "domestic", label: "Domestic" },
              { value: "international", label: "International" },
              { value: "worldwide", label: "Worldwide" },
            ],
          },
          {
            name: "coverageDays",
            label: "Coverage Days",
            type: "number",
            placeholder: "Number of days",
          },
        ],
        {
          name: "travelType",
          label: "Travel Type",
          type: "select",
          placeholder: "Select travel type",
          options: [
            { value: "leisure", label: "Leisure/Vacation" },
            { value: "business", label: "Business Travel" },
            { value: "study", label: "Student Travel" },
            { value: "medical", label: "Medical Tourism" },
          ],
        },
      ],
    },
    // Nominee toggle
    {
      rows: [
        {
          name: "nomineePresent",
          label: "Nominee details available",
          type: "checkbox",
        },
      ],
    },
    // Nominee Details
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
    // Agent toggle
    {
      rows: [
        {
          name: "hasAgent",
          label: "Insurance agent/advisor involved",
          type: "checkbox",
        },
      ],
    },
    // Agent/Advisor Details
    {
      title: "Agent/Advisor Details",
      tone: "purple",
      visibleWhen: (v) => Boolean(v.hasAgent),
      rows: [
        [
          {
            name: "agentName",
            label: "Agent Name",
            type: "text",
            placeholder: "Agent/advisor name",
          },
          {
            name: "agentContact",
            label: "Contact Number",
            type: "text",
            placeholder: "Phone number",
          },
        ],
        {
          name: "agentCode",
          label: "Agent Code/ID",
          type: "text",
          placeholder: "Agent identification code",
        },
      ],
    },
    // Claims toggle
    {
      rows: [
        {
          name: "claimsMade",
          label: "Claims made on this policy",
          type: "checkbox",
        },
      ],
    },
    // Claim History
    {
      title: "Claim History",
      tone: "red",
      visibleWhen: (v) => Boolean(v.claimsMade),
      rows: [
        [
          {
            name: "claimsCount",
            label: "Number of Claims",
            type: "number",
            placeholder: "Total claims",
          },
          {
            name: "totalClaimsAmount",
            label: "Total Claims Amount",
            type: "number",
            placeholder: "₹ Total amount",
          },
        ],
        {
          name: "lastClaimDate",
          label: "Last Claim Date",
          type: "date",
        },
      ],
    },
    // Payment Information
    {
      title: "Payment Information",
      rows: [
        [
          {
            name: "paymentMode",
            label: "Payment Mode",
            type: "select",
            placeholder: "Payment method",
            options: [
              { value: "bank-transfer", label: "Bank Transfer" },
              { value: "auto-debit", label: "Auto Debit" },
              { value: "online", label: "Online Payment" },
              { value: "cheque", label: "Cheque" },
              { value: "cash", label: "Cash" },
              { value: "credit-card", label: "Credit Card" },
            ],
          },
          {
            name: "nextDueDate",
            label: "Next Due Date",
            type: "date",
          },
        ],
      ],
    },
    // Policy Status
    {
      title: "Policy Status",
      rows: [
        {
          name: "isActive",
          label: "Policy is currently active",
          type: "checkbox",
        },
        {
          name: "renewalAlert",
          label: "Set renewal reminder alerts",
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
          placeholder: "Any additional information about the policy",
          rows: 2,
        },
      ],
    },
  ],
};
