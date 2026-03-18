export type SuggestedPrompt = {
  id: number;
  text: string;
  icon: "TrendingUp" | "BarChart3" | "Sparkles" | "Activity" | "Shield" | "Wallet";
};

export const suggestedQueries: Record<string, SuggestedPrompt[]> = {
  Stocks: [
    { id: 1, text: "Analyze ICICI Bank's financial health, key metrics, and future growth potential", icon: "TrendingUp" },
    { id: 2, text: "Deep dive into TCS Q4 concall: revenue guidance, margin outlook, and strategic initiatives", icon: "BarChart3" },
    { id: 3, text: "Evaluate DMART's FinSharpe Score breakdown with sector comparison and investment recommendation", icon: "Sparkles" },
    { id: 4, text: "Compare Reliance vs Adani Power: valuation, debt levels, growth trajectory, and risk factors", icon: "Activity" },
    { id: 5, text: "HDFC Bank Q4 earnings deep dive: NII trends, asset quality, provisioning, and ROE analysis", icon: "BarChart3" },
    // { id: 6, text: "Top 10 IT sector stocks by market cap with P/E ratios, growth prospects, and buy signals", icon: "TrendingUp" },
  ],
  "Mutual Funds": [
    { id: 1, text: "Analyse Nippon India Small Cap Fund: performance, portfolio quality, and risk assessment", icon: "BarChart3" },
    { id: 2, text: "Analyse Parag Parikh Flexi Cap Fund: strategy, holdings, and long-term return potential", icon: "TrendingUp" },
    { id: 3, text: "Analyse Quant Flexi Cap Fund: performance consistency, sector allocation, and risk-reward profile", icon: "Sparkles" },
    { id: 4, text: "Tell me fund overlap between Kotak Flexicap and HDFC Flexicap Fund", icon: "Activity" },
    { id: 5, text: "Tell me fund overlap between ICICI Prudential Large Cap Fund and HDFC Large Cap Fund", icon: "Activity" },
    { id: 6, text: "Calculate SIP returns for ₹10,000/month invested over 5, 10, and 15 years in large-cap funds", icon: "TrendingUp" },
  ],
  "Personal Finance": [
    { id: 1, text: "Can I retire in 5 years with ₹1 crore? Analyze feasibility, corpus adequacy, and withdrawal strategy", icon: "Activity" },
    { id: 2, text: "I earn ₹1.8L per month. I want to buy a house in 5 years, retire in 25 years, and fund my child's education in 18 years. Optimise my monthly investments across goals", icon: "Wallet" },
    { id: 3, text: "Help me plan my retirement corpus: how much I need, where to invest, and how to get there", icon: "TrendingUp" },
    { id: 4, text: "Tax optimization strategies for salaried employees: HRA, 80C, 80D, NPS, and new tax regime", icon: "Shield" },
    { id: 5, text: "Emergency fund planning: calculate ideal amount, best instruments, and liquidity management", icon: "Shield" },
  ],
};

export const suggestedQueriesCategories = [
  "Stocks",
  "Mutual Funds",
  "Personal Finance",
];
