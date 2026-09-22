// PLACEHOLDER CONTENT: no backend serves usage, billing, security, phone,
// membership or token figures yet. These are the reference design's demo
// values, shown so the Account Settings and Profile Settings screens keep
// their full layout; replace each block when its API exists.

// ============================================================
// Account Settings (sidebar footer / header avatar -> modal)
// ============================================================
export const accountProfile = {
  phone: "+91 98765 43210",
  memberSince: "January 2024",
  badge: "Premium Member",
};

export const accountUsage = {
  queries: { used: 127, total: 500 },
  creditsLeft: { amount: 7.66, total: 10 },
  tokensUsed: { count: 45680, percent: 23, note: "this month" },
  totalCost: { amount: 2.34, perQuery: 0.018, note: "this month" },
  avgTokensPerQuery: 360,
};

export const accountSecurity: {
  label: string;
  sub: string;
  action?: string;
  verified?: boolean;
}[] = [
  { label: "Password", sub: "Last updated 2 months ago", action: "Change" },
  { label: "Two-Factor Authentication", sub: "Enabled", action: "Manage" },
  { label: "Email Verification", sub: "Verified", verified: true },
];

export const accountBilling = {
  planName: "Premium Plan",
  status: "Active",
  activeUntil: "Dec 31, 2024",
  features: [
    "Unlimited AI analysis",
    "Advanced portfolio tools",
    "Priority support",
  ],
  card: "•••• 4242",
};

export const accountAppSettings = [
  {
    label: "Notifications",
    sub: "Email & push notifications",
    action: "Configure",
  },
  { label: "Data Export", sub: "Download your data", action: "Export" },
  { label: "Privacy Settings", sub: "Manage data sharing", action: "Manage" },
];

// ============================================================
// Profile Settings page (Account modal -> "View Profile Settings")
// ============================================================
export const profileSettings = {
  planBadge: "Premium Pro",
  memberSince: "Since January 2024",

  overview: {
    totalQueries: 2847,
    tokensUsed: "1248K",
    monthlyTrend: [
      { m: "Jul", v: 180 },
      { m: "Aug", v: 260 },
      { m: "Sep", v: 340 },
      { m: "Oct", v: 420 },
      { m: "Nov", v: 520 },
      { m: "Dec", v: 580 },
    ],
    december: { percent: 57, used: 2847, total: 5000 },
  },

  subscription: {
    plan: "Premium Pro",
    price: "₹12,000/year",
    billingNote: "Annual billing",
    status: "Active",
    nextBilling: "Dec 31, 2024",
    daysRemaining: 89,
    features: [
      "Unlimited AI Analysis",
      "Advanced Portfolio Tools",
      "Real-time Market Data",
      "Priority Support",
      "Export Capabilities",
      "Custom Alerts",
    ],
    recentBilling: [
      {
        date: "Dec 31, 2023",
        plan: "Premium Pro Annual",
        amount: "₹12,000",
        status: "Paid",
      },
      {
        date: "Dec 31, 2022",
        plan: "Premium Pro Annual",
        amount: "₹10,000",
        status: "Paid",
      },
    ],
  },

  usageAnalytics: {
    dailyAverage: 42,
    peakDay: { value: 89, date: "Nov 15" },
    monthlyQueryVolume: [
      { m: "Jul", v: 820 },
      { m: "Aug", v: 960 },
      { m: "Sep", v: 1100 },
      { m: "Oct", v: 1240 },
      { m: "Nov", v: 1420 },
      { m: "Dec", v: 1180 },
    ],
    analysisTypes: [
      { name: "Stock Analysis", pct: 45 },
      { name: "Portfolio Review", pct: 25 },
      { name: "Market Research", pct: 20 },
      { name: "Personal Finance", pct: 10 },
    ],
    last7Days: [
      { d: "1", v: 28 },
      { d: "2", v: 34 },
      { d: "3", v: 22 },
      { d: "4", v: 31 },
      { d: "5", v: 18 },
      { d: "6", v: 26 },
      { d: "7", v: 36 },
    ],
  },

  tokenUsage: {
    percent: 62,
    used: 1247823,
    limit: 2000000,
    tiles: { used: "1248K", remaining: "752K", limit: "2000K" },
    monthlyConsumption: [
      { m: "Jul", v: 120000 },
      { m: "Aug", v: 150000 },
      { m: "Sep", v: 175000 },
      { m: "Oct", v: 200000 },
      { m: "Nov", v: 235000 },
      { m: "Dec", v: 190000 },
    ],
    efficiency: {
      avgPerQuery: 438,
      mostEfficient: "Stock analysis",
      complex: { name: "Portfolio deep dive", tokens: 1247 },
    },
    renewal: { date: "Jan 1, 2025", days: 23 },
  },
};
