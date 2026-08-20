/**
 * Domain-named wrappers over the generated Pipelines client.
 *
 * The generated fetchers resolve on every status — a 402 comes back as data,
 * not as a rejection — so react-query would treat "you cannot afford this" as
 * a successful query. Everything here unwraps the `{data, status}` envelope
 * and throws `PipelineApiError` on a non-2xx, which is what the screens branch
 * on (402 short balance, 404 gone, 409 not published yet).
 */

import {
  deletePurchaseApiPurchasesPurchaseIdDelete,
  getCatalogApiPipelinesGet,
  getReportApiPipelineReportsRunIdGet,
  listPurchasesApiPurchasesGet,
  mintShareApiPurchasesPurchaseIdSharePost,
  purchaseApiPipelinesPipelineIdPurchasePost,
  quotePipelineApiPipelinesPipelineIdQuotePost,
  revokeShareApiPurchasesPurchaseIdShareDelete,
  runStatusApiPipelineRunsRunIdGet,
} from "@/api/generated/pipelines-apis/pipeline-apis/pipeline-apis";
import type {
  CatalogEntry,
  OwnedPurchase,
  PurchaseResponse,
  QuoteResponse,
  ReportResponse,
  RunStatusResponse,
  ShareResponse,
} from "@/api/generated/pipelines-apis/models";
import type { SharedReportResponse } from "../types/pipelines.types";

export class PipelineApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PipelineApiError";
  }

  /** The payment boundary's refusal: the balance will not cover the price. */
  get isShortBalance() {
    return this.status === 402;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

interface Envelope<T> {
  data: T | unknown;
  status: number;
}

function unwrap<T>(envelope: Envelope<T>): T {
  if (envelope.status >= 200 && envelope.status < 300) {
    return envelope.data as T;
  }
  const detail = (envelope.data as { detail?: unknown } | null)?.detail;
  const message =
    typeof detail === "string"
      ? detail
      : Array.isArray(detail) && detail.length
        ? String((detail[0] as { msg?: string })?.msg ?? "Invalid request")
        : `Request failed (${envelope.status})`;
  throw new PipelineApiError(envelope.status, message);
}

export async function fetchCatalog(signal?: AbortSignal) {
  return unwrap<CatalogEntry[]>(await getCatalogApiPipelinesGet({ signal }));
}

/**
 * `symbol` is null for a market Pipeline, whose target is constant and built
 * server-side. Sent anyway rather than omitted, so the request says outright
 * that nothing was named.
 */
export async function fetchQuote(pipelineId: string, symbol: string | null) {
  return unwrap<QuoteResponse>(
    await quotePipelineApiPipelinesPipelineIdQuotePost(pipelineId, { symbol }),
  );
}

export async function purchasePipeline(
  pipelineId: string,
  symbol: string | null,
  threadId?: string | null,
) {
  return unwrap<PurchaseResponse>(
    await purchaseApiPipelinesPipelineIdPurchasePost(pipelineId, {
      symbol,
      // The thread the purchase was made from: publish delivers the Summary
      // Card there. Omitted outside chat, which skips delivery by design.
      thread_id: threadId ?? null,
    }),
  );
}

export async function fetchRunStatus(runId: string, signal?: AbortSignal) {
  return unwrap<RunStatusResponse>(
    await runStatusApiPipelineRunsRunIdGet(runId, { signal }),
  );
}

export async function fetchReport(runId: string, signal?: AbortSignal) {
  return unwrap<ReportResponse>(
    await getReportApiPipelineReportsRunIdGet(runId, { signal }),
  );
}

export async function fetchOwnedPurchases(signal?: AbortSignal) {
  return unwrap<OwnedPurchase[]>(
    await listPurchasesApiPurchasesGet({ signal }),
  );
}

export async function deletePurchase(purchaseId: string) {
  return unwrap<void>(
    await deletePurchaseApiPurchasesPurchaseIdDelete(purchaseId),
  );
}

export async function mintShare(purchaseId: string) {
  return unwrap<ShareResponse>(
    await mintShareApiPurchasesPurchaseIdSharePost(purchaseId),
  );
}

export async function revokeShare(purchaseId: string) {
  return unwrap<void>(
    await revokeShareApiPurchasesPurchaseIdShareDelete(purchaseId),
  );
}

/**
 * The authed PDF URL — its own streaming proxy, not `/api/utilities`.
 *
 * That proxy reads the upstream body as text (mangling PDF bytes) and drops
 * `Content-Disposition`, so the generated fetcher for this route is unusable
 * and `src/app/api/pipeline-reports/[runId]/pdf/route.ts` stands in for it.
 */
export function reportPdfUrl(runId: string) {
  return `/api/pipeline-reports/${encodeURIComponent(runId)}/pdf`;
}

/* -------------------------------------------------------------------------- */
/* The public share routes                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Served by `src/app/api/shared/[..._slug]/route.ts`, not the authed
 * `/api/utilities` proxy — a share link has to work with no session at all.
 * Hand-written for the same reason the generator skips these paths.
 */
export const SHARED_REPORT_BASE = "/api/shared/reports";

export async function fetchSharedReport(token: string, signal?: AbortSignal) {
  const res = await fetch(
    `${SHARED_REPORT_BASE}/${encodeURIComponent(token)}`,
    {
      signal,
    },
  );
  if (!res.ok) {
    const detail = await res
      .json()
      .then((b: { detail?: string }) => b?.detail)
      .catch(() => undefined);
    throw new PipelineApiError(
      res.status,
      detail ?? `Request failed (${res.status})`,
    );
  }
  return (await res.json()) as SharedReportResponse;
}

export function sharedReportPdfUrl(token: string) {
  return `${SHARED_REPORT_BASE}/${encodeURIComponent(token)}/pdf`;
}
