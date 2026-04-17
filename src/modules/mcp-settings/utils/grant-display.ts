import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";

export type DisplayStatus =
  | "pending"
  | "active"
  | "queued"
  | "expired"
  | "rejected"
  | "revoked";

export function deriveDisplayStatus(grant: MCPGrantResponse): DisplayStatus {
  if (grant.status === "pending") return "pending";
  if (grant.status === "rejected") return "rejected";
  if (grant.status === "revoked") return "revoked";

  const now = Date.now();
  const startsAt = grant.starts_at ? new Date(grant.starts_at).getTime() : null;
  const expiresAt = grant.expires_at
    ? new Date(grant.expires_at).getTime()
    : null;

  if (startsAt !== null && startsAt > now) return "queued";
  if (expiresAt !== null && expiresAt <= now) return "expired";
  return "active";
}

export function isActiveGrant(grant: MCPGrantResponse): boolean {
  return deriveDisplayStatus(grant) === "active";
}
