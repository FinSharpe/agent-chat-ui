import { FormSchema } from "../shared/form-schema";

export const REAL_ESTATE_SCHEMA: FormSchema = {
  submitClassName: "bg-green-600 hover:bg-green-700",
  submitLabel: (isEdit) => (isEdit ? "Update Property" : "Add Property"),
  initialValues: {
    propertyType: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    purchaseDate: "",
    purchasePrice: "",
    currentValue: "",
    area: "",
    areaUnit: "sq-ft",
    possession: "self-occupied",
    ageOfProperty: "",
    registrationNumber: "",
    monthlyRental: "",
    tenantDetails: "",
    leaseStartDate: "",
    leaseEndDate: "",
    hasLoan: false,
    mortgageOutstanding: "",
    bankName: "",
    monthlyEMI: "",
    interestRate: "",
    propertyTax: "",
    maintenanceCharges: "",
    insurancePremium: "",
    stampDutyPaid: "",
    description: "",
  },
  validate: (v) => {
    if (v.possession === "rented" && !v.monthlyRental) {
      return "Please enter monthly rental income for rented property";
    }
    if (v.hasLoan && (!v.monthlyEMI || !v.interestRate)) {
      return "Please enter EMI and interest rate for home loan";
    }
    return null;
  },
  sections: [
    {
      rows: [
        {
          name: "propertyType",
          label: "Property Type",
          type: "select",
          required: true,
          placeholder: "Select property type",
          options: [
            { value: "residential-house", label: "Residential House" },
            { value: "residential-apartment", label: "Residential Apartment" },
            { value: "commercial-office", label: "Commercial Office" },
            { value: "commercial-retail", label: "Commercial Retail" },
            { value: "industrial", label: "Industrial Property" },
            { value: "land", label: "Land/Plot" },
            { value: "warehouse", label: "Warehouse" },
            { value: "other", label: "Other" },
          ],
        },
      ],
    },
    {
      rows: [
        {
          name: "address",
          label: "Property Address",
          type: "textarea",
          required: true,
          rows: 2,
          placeholder: "Enter full property address",
        },
        [
          { name: "city", label: "City", type: "text", required: true, placeholder: "City" },
          { name: "state", label: "State", type: "text", required: true, placeholder: "State" },
        ],
        { name: "pincode", label: "PIN Code", type: "text", placeholder: "PIN Code" },
      ],
    },
    {
      rows: [
        [
          { name: "purchaseDate", label: "Purchase Date", type: "date" },
          {
            name: "purchasePrice",
            label: "Purchase Price",
            type: "number",
            required: true,
            placeholder: "₹ Amount",
          },
        ],
      ],
    },
    {
      rows: [
        {
          name: "currentValue",
          label: "Current Market Value",
          type: "number",
          placeholder: "₹ Current estimated value",
        },
      ],
    },
    {
      rows: [
        [
          { name: "area", label: "Property Area", type: "number", placeholder: "Area", colSpan: 2 },
          {
            name: "areaUnit",
            label: "Unit",
            type: "select",
            options: [
              { value: "sq-ft", label: "Sq. Ft." },
              { value: "sq-m", label: "Sq. M." },
              { value: "acres", label: "Acres" },
              { value: "sq-yards", label: "Sq. Yards" },
            ],
          },
        ],
      ],
    },
    {
      rows: [
        {
          name: "possession",
          label: "Property Possession",
          type: "select",
          placeholder: "Select possession type",
          options: [
            { value: "self-occupied", label: "Self Occupied" },
            { value: "rented", label: "Rented Out" },
            { value: "vacant", label: "Vacant" },
            { value: "under-construction", label: "Under Construction" },
          ],
        },
      ],
    },
    {
      rows: [
        [
          { name: "ageOfProperty", label: "Age of Property (Years)", type: "number", placeholder: "Years" },
          {
            name: "registrationNumber",
            label: "Registration Number",
            type: "text",
            placeholder: "Property registration no.",
          },
        ],
      ],
    },
    {
      title: "Rental Details",
      tone: "blue",
      visibleWhen: (v) => v.possession === "rented",
      rows: [
        { name: "monthlyRental", label: "Monthly Rental Income", type: "number", placeholder: "₹ Monthly rent" },
        { name: "tenantDetails", label: "Tenant Details", type: "text", placeholder: "Tenant name or company" },
        [
          { name: "leaseStartDate", label: "Lease Start Date", type: "date" },
          { name: "leaseEndDate", label: "Lease End Date", type: "date" },
        ],
      ],
    },
    {
      rows: [
        { name: "hasLoan", label: "Property has an active home loan", type: "checkbox" },
      ],
    },
    {
      title: "Home Loan Details",
      tone: "orange",
      visibleWhen: (v) => Boolean(v.hasLoan),
      rows: [
        [
          { name: "mortgageOutstanding", label: "Outstanding Amount", type: "number", placeholder: "₹ Loan amount" },
          { name: "bankName", label: "Bank/Lender Name", type: "text", placeholder: "Bank name" },
        ],
        [
          { name: "monthlyEMI", label: "Monthly EMI", type: "number", placeholder: "₹ EMI amount" },
          { name: "interestRate", label: "Interest Rate (%)", type: "number", step: "0.01", placeholder: "Rate %" },
        ],
      ],
    },
    {
      title: "Additional Costs & Charges",
      rows: [
        [
          { name: "propertyTax", label: "Annual Property Tax", type: "number", placeholder: "₹ Tax amount" },
          { name: "maintenanceCharges", label: "Monthly Maintenance", type: "number", placeholder: "₹ Maintenance" },
        ],
        [
          { name: "insurancePremium", label: "Annual Insurance Premium", type: "number", placeholder: "₹ Insurance" },
          { name: "stampDutyPaid", label: "Stamp Duty Paid", type: "number", placeholder: "₹ Stamp duty" },
        ],
      ],
    },
    {
      rows: [
        {
          name: "description",
          label: "Additional Notes",
          type: "textarea",
          rows: 2,
          placeholder: "Any additional information about the property",
        },
      ],
    },
  ],
};
