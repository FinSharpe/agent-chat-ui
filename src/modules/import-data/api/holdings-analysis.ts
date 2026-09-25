/**
 * The holdings-analysis endpoints (`/api/portfolios/analyze`,
 * `/api/mf-portfolios/analytics`, `/api/etf-portfolios/analytics`) as one
 * cached read. The Analyse view and the net-worth card's day move both go
 * through it, keyed on the request body, so a book one of them has already
 * asked about is not asked about again.
 */

export class AnalysisError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export const holdingsAnalysisKey = (url: string, body: string) =>
  ["holdings-analysis", url, body] as const;

/** Cold, an analysis can take half a minute; a warm one is reused this long. */
export const HOLDINGS_ANALYSIS_CACHE = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
} as const;

export async function fetchHoldingsAnalysis(url: string, body: string) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    throw new AnalysisError("The analysis service could not be reached.");
  }
  if (!res.ok) {
    throw new AnalysisError(
      res.status >= 500
        ? "The analysis service did not respond."
        : "The analysis service could not read these holdings.",
      res.status,
    );
  }
  return (await res.json()) as Record<string, unknown>;
}
