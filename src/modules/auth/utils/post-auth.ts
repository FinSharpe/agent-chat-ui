import { extractApiError } from "./extract-api-error";

/**
 * POST to one of the `/api/auth/*` proxy routes. A refused request throws
 * with the backend's own message (or `fallback`), so the screen can show it
 * as-is. A network failure or a non-JSON body (a gateway error page) gets a
 * readable message instead of the browser's "Failed to fetch".
 */
export async function postAuth<T>(
  url: string,
  body: unknown,
  fallback: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "We couldn't reach FinSharpe. Check your connection and try again.",
    );
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractApiError(data, fallback));
  return data as T;
}

/** The first message among `fields`, in that order, from react-hook-form errors. */
export function firstFieldError<K extends string>(
  errors: Partial<Record<K, { message?: string }>>,
  fields: readonly K[],
): string | undefined {
  for (const field of fields) {
    const message = errors[field]?.message;
    if (message) return message;
  }
  return undefined;
}
