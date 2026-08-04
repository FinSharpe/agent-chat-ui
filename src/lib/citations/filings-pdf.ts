/**
 * Fetching the source document behind a filings citation.
 *
 * Goes through this app's authenticated `/api/filings/pdf` route, which proxies
 * the backend route of the same name — the upstream document provider rejects
 * direct browser fetches outright, so proxying is mandatory rather than a
 * convenience. Both identifiers go on the wire verbatim from the citation.
 */

const MAX_CACHED_DOCUMENTS = 8;

/** Keyed by attachment identifier: every citation into one filing shares it. */
const cache = new Map<string, Uint8Array>();
const inFlight = new Map<string, Promise<Uint8Array>>();

export class FilingUnavailableError extends Error {}

async function request(
  subcatname: string,
  attachmentName: string,
): Promise<Uint8Array> {
  const params = new URLSearchParams({
    subcatname,
    attachment_name: attachmentName,
  });

  const response = await fetch(`/api/filings/pdf?${params}`, {
    headers: { Accept: "application/pdf" },
  });

  if (!response.ok) {
    throw new FilingUnavailableError(
      response.status === 404
        ? "This filing is no longer available from the provider."
        : "The filing could not be loaded.",
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  // A 200 with no bytes is a broken document, not a blank one: fail so the
  // viewer shows an error and nothing is cached.
  if (bytes.byteLength === 0) {
    throw new FilingUnavailableError("The filing came back empty.");
  }
  return bytes;
}

/**
 * The document behind a citation, from cache when it is there.
 *
 * Concurrent loads of one document share a single request: citation chips are
 * small and adjacent, so two clicks in quick succession — or a footer row
 * opened while a chip is still loading — are ordinary rather than exotic.
 *
 * The returned bytes are shared, so callers that hand them to a consumer which
 * detaches the buffer (pdf.js does) must pass a copy.
 */
export function loadFilingPdf(
  subcatname: string,
  attachmentName: string,
): Promise<Uint8Array> {
  const cached = cache.get(attachmentName);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(attachmentName);
  if (pending) return pending;

  const load = request(subcatname, attachmentName)
    .then((bytes) => {
      if (cache.size >= MAX_CACHED_DOCUMENTS) {
        // Insertion-ordered: evict the oldest rather than growing without
        // bound over a long research session.
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(attachmentName, bytes);
      return bytes;
    })
    // A failure clears the slot as surely as a success does, so a dropped
    // connection is retried rather than remembered.
    .finally(() => inFlight.delete(attachmentName));

  inFlight.set(attachmentName, load);
  return load;
}
