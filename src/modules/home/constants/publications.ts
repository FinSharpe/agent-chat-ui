import type { Publication } from "../types/home.types";

// PLACEHOLDER CONTENT — static copy from the design reference; there is no publications feed API yet.
// A deliberate mix of formats (short video, visual post, long-form article)
// so the section reads like a publication rather than a blog roll.
export const PUBLICATIONS: Publication[] = [
  {
    id: "pub-1",
    kind: "video",
    category: "Market Explainer",
    title: "Why the RBI held rates — and what it means for your debt funds",
    excerpt:
      "Three minutes on the policy decision, the reasoning behind it, and the practical effect on short and long duration funds.",
    author: "Aditi Rao",
    date: "20 Aug",
    duration: "3:12",
    gradient: "linear-gradient(150deg, #063BAA 0%, #0A1F4D 100%)",
    image: "/graphics/publications-1.jpg",
  },
  {
    id: "pub-2",
    kind: "post",
    category: "Chart of the Week",
    title: "Where the FII money actually went in July",
    excerpt:
      "Sector-by-sector flows, mapped. Financials took the largest share, but the surprise is in capital goods.",
    author: "FinSharpe Research",
    date: "19 Aug",
    frames: 5,
    gradient: "linear-gradient(150deg, #97edcc 0%, #4FC3A1 100%)",
  },
  {
    id: "pub-3",
    kind: "article",
    category: "Deep Dive",
    title: "The quiet cost of holding four flexi-cap funds",
    excerpt:
      "Overlap analysis across the ten largest flexi-cap schemes, and what genuine diversification would have looked like instead.",
    author: "Nikhil Menon",
    date: "18 Aug",
    readTime: "8 min read",
    gradient: "linear-gradient(150deg, #0A1F4D 0%, #063BAA 100%)",
    body: [
      "Holding more funds is not the same as being diversified. Across the ten largest flexi-cap schemes in India, the average pairwise holdings overlap sits at 31% — and for the four most widely held, it climbs past 40%.",
      "That means an investor who owns four of them is, in practice, running something much closer to a concentrated large-cap portfolio with four expense ratios attached to it.",
      "The effect compounds quietly. Each fund charges its own fee on substantially the same underlying companies, while the perceived safety of holding several schemes discourages the investor from looking any closer.",
      "A cleaner structure is usually two funds with genuinely different mandates — say one flexi-cap and one mid-cap — reviewed annually for drift, rather than four that converge on the same fifty names.",
    ],
  },
  {
    id: "pub-4",
    kind: "video",
    category: "Founder Notes",
    title: "How we think about risk at FinSharpe",
    excerpt:
      "A short conversation on why risk profiling should change with your life stage, not just your appetite.",
    author: "FinSharpe Talks",
    date: "16 Aug",
    duration: "6:48",
    gradient: "linear-gradient(150deg, #5B21B6 0%, #063BAA 100%)",
  },
  {
    id: "pub-5",
    kind: "post",
    category: "By the Numbers",
    title: "What ₹10,000 a month became over twenty years",
    excerpt:
      "Four SIP scenarios, same monthly amount, very different endings. Swipe through the outcomes.",
    author: "FinSharpe Research",
    date: "14 Aug",
    frames: 4,
    gradient: "linear-gradient(150deg, #F59E0B 0%, #EF7C1A 100%)",
  },
  {
    id: "pub-6",
    kind: "article",
    category: "Tax",
    title: "Harvesting losses without wrecking your allocation",
    excerpt:
      "The mechanics of booking a loss, the thirty-day trap, and how to stay invested while you do it.",
    author: "Priya Iyer",
    date: "12 Aug",
    readTime: "6 min read",
    gradient: "linear-gradient(150deg, #0A9E6E 0%, #0A1F4D 100%)",
    body: [
      "Tax loss harvesting is simple in principle: sell a holding that is below your purchase price, book the loss, and set it against gains elsewhere in the same financial year.",
      "The complication is that most people sell, feel the relief of the tax saving, and then sit in cash — which is usually more expensive than the tax they saved.",
      "The fix is to stay in the market while you harvest. Sell the specific scheme, and buy a comparable but not identical one immediately, so your exposure never lapses.",
      "Losses that exceed your gains do not disappear. They carry forward for eight assessment years, which makes a loss booked in a weak year genuinely valuable later.",
    ],
  },
];

/** Home shows the three newest — the feed is the whole feature here, not a
 *  teaser for another screen. */
export const HOME_PUBLICATION_LIMIT = 3;
