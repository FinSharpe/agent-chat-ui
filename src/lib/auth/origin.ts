export function validateOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const host = request.headers.get("host");
  const originHost = new URL(origin).host;

  if (originHost !== host) {
    throw new Error("Forbidden origin");
  }
}
