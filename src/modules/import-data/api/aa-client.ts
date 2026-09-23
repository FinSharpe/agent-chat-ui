/**
 * Typed client for the backend's Account Aggregator API — the same transport
 * finsharpe-mobile uses (`lib/features/portfolio/data/aa_api.dart`). No
 * MoneyOne credentials live in this app any more; the backend holds them and
 * scopes every call to the session's user.
 *
 * ## The path
 * The backend mounts its router at a literal `/api/aa` prefix
 * (finsharpe-agents `src/api/aa.py`: `APIRouter(prefix="/api/aa")`). This app's
 * catch-all proxy (`src/app/api/[..._path]/route.ts`) *strips* the leading
 * `/api`, so calling `/api/aa/...` from the browser would reach the backend as
 * `/aa/...` and 404. The utilities proxy re-adds it
 * (`src/app/api/utilities/[..._slug]/route.ts`: `${backendUrl}/api/${path}`),
 * so `/api/utilities/aa/consents` lands on the backend's `/api/aa/consents`.
 * That proxy also injects the session JWT and the `X-Fgp` fingerprint and
 * transparently refreshes an expired access token.
 *
 * Verified against the live deployment: `GET {LANGGRAPH_API_URL}/openapi.json`
 * lists all six `/api/aa/consents*` paths, and an unauthenticated probe returns
 * 401/422 (the route exists) rather than 404.
 */
import type {
  AaConsentType,
  ConsentRecord,
  ConsentReturnParams,
  CreateConsentResponse,
  DiscoveredConsent,
  FiBlob,
  ResolveConsentResponse,
} from "../types/aa";

const BASE = "/api/utilities/aa";

/**
 * How an AA failure should be handled. Mirrors the backend's own `kind`
 * (finsharpe-agents `_KIND_STATUS`: consent-dead → 410, data-missing → 425,
 * transient → 502) so the two apps classify identically.
 */
export type AaErrorKind = "consent-dead" | "data-missing" | "transient";

export class AaError extends Error {
  readonly kind: AaErrorKind;
  readonly status: number;
  readonly errorCode?: string;

  constructor(
    message: string,
    kind: AaErrorKind,
    status: number,
    errorCode?: string,
  ) {
    super(message);
    this.name = "AaError";
    this.kind = kind;
    this.status = status;
    this.errorCode = errorCode;
  }
}

const DEFAULT_MESSAGE = "The Account Aggregator could not be reached.";

/** Status → kind, used when the body carries no `detail.kind`. */
function kindForStatus(status: number): AaErrorKind {
  if (status === 410) return "consent-dead";
  if (status === 425) return "data-missing";
  return "transient";
}

function toAaError(status: number, body: unknown): AaError {
  const detail = (body as { detail?: unknown } | null)?.detail;

  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const d = detail as {
      message?: string;
      kind?: string;
      errorCode?: string | null;
    };
    const kind =
      d.kind === "consent-dead" || d.kind === "data-missing"
        ? d.kind
        : d.kind === "transient"
          ? "transient"
          : kindForStatus(status);
    return new AaError(
      d.message || DEFAULT_MESSAGE,
      kind,
      status,
      d.errorCode ?? undefined,
    );
  }

  // FastAPI also raises plain-string details (404 "Consent not found",
  // 409 "Consent belongs to another user", 422 validation text).
  const message = typeof detail === "string" ? detail : DEFAULT_MESSAGE;
  return new AaError(message, kindForStatus(status), status);
}

async function request<T>(
  path: string,
  init?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: init?.signal,
    });
  } catch (cause) {
    // Offline / DNS / abort — never a dead consent, always worth a retry.
    throw new AaError(
      cause instanceof Error && cause.name === "AbortError"
        ? "The request timed out."
        : DEFAULT_MESSAGE,
      "transient",
      0,
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) throw toAaError(response.status, body);
  return body as T;
}

// ---------------------------------------------------------------------------
// The seven calls
// ---------------------------------------------------------------------------

/**
 * Consents already held at the AA for this mobile number. A failure here is
 * never fatal — the caller falls through to `createConsent`.
 */
export async function discoverConsents(
  type: AaConsentType,
  mobileNo: string,
): Promise<DiscoveredConsent[]> {
  const data = await request<{ consents?: DiscoveredConsent[] }>(
    "/consents/discover",
    { method: "POST", body: { type, mobileNo } },
  );
  return Array.isArray(data?.consents) ? data.consents : [];
}

/**
 * Create a consent — or, with `consentHandle`, resume a PENDING one instead of
 * stacking a duplicate. Returns the OneMoney URL the browser must visit.
 */
export function createConsent(body: {
  type: AaConsentType;
  mobileNo: string;
  pan: string;
  consentHandle?: string | null;
  accountID?: string | null;
}): Promise<CreateConsentResponse> {
  return request<CreateConsentResponse>("/consents", {
    method: "POST",
    body,
  });
}

/**
 * Settle a consent after approval. Three modes (backend `ResolveConsentBody`):
 * the raw return params, `consentHandle` + `mobileNo`, or `consentID` +
 * `mobileNo` (used to adopt a consent this browser already knows about).
 */
export function resolveConsent(
  body: { type: AaConsentType } & ConsentReturnParams,
): Promise<ResolveConsentResponse> {
  return request<ResolveConsentResponse>("/consents/resolve", {
    method: "POST",
    body,
  });
}

/**
 * Every consent linked to the signed-in user. Rows this build can't parse are
 * dropped rather than thrown, so one unknown consent type can't brick the page.
 */
export async function listConsents(): Promise<ConsentRecord[]> {
  const data = await request<{ consents?: unknown[] }>("/consents");
  if (!Array.isArray(data?.consents)) return [];
  return data.consents.filter(
    (c): c is ConsentRecord =>
      !!c &&
      typeof c === "object" &&
      typeof (c as ConsentRecord).consentID === "string" &&
      typeof (c as ConsentRecord).type === "string",
  );
}

/**
 * One consent's FI data. `includeRaw` also returns MoneyOne's per-account
 * payloads, which the existing analysis modals parse for the column-level
 * detail (UCC, registrar, MICR…) the normalized shapes don't carry.
 */
export function getFiData(
  consentID: string,
  opts?: { includeRaw?: boolean; signal?: AbortSignal },
): Promise<FiBlob & { raw?: unknown[] | null }> {
  const query = opts?.includeRaw ? "?includeRaw=true" : "";
  return request(
    `/consents/${encodeURIComponent(consentID)}/fi-data${query}`,
    { signal: opts?.signal },
  );
}

/** Ask the AA for a fresh pull. Data lands asynchronously — poll fi-data after. */
export function refreshConsent(
  consentID: string,
): Promise<{ consentId?: string | null; sessionId?: string | null }> {
  return request(`/consents/${encodeURIComponent(consentID)}/refresh`, {
    method: "POST",
  });
}

/** Withdraw the consent at the AA and drop it from the user's account. */
export function revokeConsent(
  consentID: string,
): Promise<{ revoked: boolean; alreadyGone: boolean }> {
  return request(`/consents/${encodeURIComponent(consentID)}`, {
    method: "DELETE",
  });
}
