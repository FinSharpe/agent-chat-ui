"use client";
import { ConsentType } from "./moneyone.enums";
import { v4 as uuidv4 } from "uuid";

// LocalStorage keys
const USER_ID_KEY = "moneyone:userId";
const CONSENT_KEY_PREFIX = "moneyone:consent:";
const USER_CONSENTS_INDEX_PREFIX = "moneyone:user:";

// Client-side consent data structure stored in localStorage
export interface ConsentData {
  consentID: string;
  consentCreationData: string; // ISO date string
  consentExpiry: string; // ISO date string
  userId: string;
  isDataReady: boolean;
  type: ConsentType;
  name: string | null;
  mobileNo: string;
  /**
   * Set when an FI-data fetch/refresh fails because the consent is no longer
   * usable (expired/revoked/invalid on MoneyOne's side, even if our locally
   * stored `consentExpiry` date hasn't passed yet). Drives the "Expired" card
   * state with Refresh/Delete actions. Cleared on a successful refresh.
   */
  isExpired?: boolean;
}

/**
 * Get or create a unique user ID for this browser
 */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * Save a consent to localStorage
 */
export function saveConsent(consent: ConsentData): void {
  if (typeof window === "undefined") return;

  const consentKey = `${CONSENT_KEY_PREFIX}${consent.consentID}`;
  localStorage.setItem(consentKey, JSON.stringify(consent));

  // Update user's consent index
  const userId = getUserId();
  const userConsentsKey = `${USER_CONSENTS_INDEX_PREFIX}${userId}:consents`;
  const existingConsents = localStorage.getItem(userConsentsKey);
  let consentIds: string[];
  try {
    consentIds = existingConsents ? JSON.parse(existingConsents) : [];
  } catch (e) {
    console.warn("Corrupted consent index in localStorage, resetting:", e);
    consentIds = [];
  }

  if (!consentIds.includes(consent.consentID)) {
    consentIds.push(consent.consentID);
    localStorage.setItem(userConsentsKey, JSON.stringify(consentIds));
  }

  // Dispatch custom event for same-tab updates
  window.dispatchEvent(
    new CustomEvent("moneyone:consent-updated", {
      detail: { consentType: consent.type, type: "consent" },
    })
  );
}

/**
 * Get a consent by ID
 */
export function getConsent(consentID: string): ConsentData | null {
  if (typeof window === "undefined") return null;

  const consentKey = `${CONSENT_KEY_PREFIX}${consentID}`;
  const consentData = localStorage.getItem(consentKey);

  if (!consentData) return null;

  try {
    return JSON.parse(consentData) as ConsentData;
  } catch (e) {
    console.warn("Failed to parse consent data from localStorage for key:", consentKey, e);
    return null;
  }
}

/**
 * Get user's consent by type
 * Returns the most recent non-expired consent for the given type
 */
export function getUserConsent(consentType: ConsentType): ConsentData | null {
  if (typeof window === "undefined") return null;

  const allConsents = getAllUserConsents();
  const now = new Date();

  // Filter by type and not expired
  const validConsents = allConsents.filter(
    (c) => c.type === consentType && new Date(c.consentExpiry) > now
  );

  // Return the most recent one
  if (validConsents.length === 0) return null;

  validConsents.sort((a, b) =>
    new Date(b.consentCreationData).getTime() - new Date(a.consentCreationData).getTime()
  );

  return validConsents[0];
}

/**
 * Update an existing consent
 */
export function updateConsent(
  consentID: string,
  updates: Partial<ConsentData>
): void {
  if (typeof window === "undefined") return;

  const existing = getConsent(consentID);
  if (!existing) return;

  const updated = { ...existing, ...updates };
  saveConsent(updated);
  // saveConsent already dispatches the event, no need to dispatch again
}

/**
 * Delete a consent
 */
export function deleteConsent(consentID: string): void {
  if (typeof window === "undefined") return;

  const consent = getConsent(consentID);
  const consentKey = `${CONSENT_KEY_PREFIX}${consentID}`;
  localStorage.removeItem(consentKey);

  // Remove from user's consent index
  const userId = getUserId();
  const userConsentsKey = `${USER_CONSENTS_INDEX_PREFIX}${userId}:consents`;
  const existingConsents = localStorage.getItem(userConsentsKey);

  if (existingConsents) {
    try {
      const consentIds: string[] = JSON.parse(existingConsents);
      const filtered = consentIds.filter((id) => id !== consentID);
      localStorage.setItem(userConsentsKey, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Corrupted consent index in localStorage, clearing:", e);
      localStorage.removeItem(userConsentsKey);
    }
  }

  // Dispatch custom event for same-tab updates
  if (consent) {
    window.dispatchEvent(
      new CustomEvent("moneyone:consent-updated", {
        detail: { consentType: consent.type, type: "consent" },
      })
    );
  }
}

/**
 * Get all consents for the current user
 */
export function getAllUserConsents(): ConsentData[] {
  if (typeof window === "undefined") return [];

  const userId = getUserId();
  const userConsentsKey = `${USER_CONSENTS_INDEX_PREFIX}${userId}:consents`;
  const consentIdsData = localStorage.getItem(userConsentsKey);

  if (!consentIdsData) return [];

  try {
    const consentIds: string[] = JSON.parse(consentIdsData);
    const consents: ConsentData[] = [];

    for (const id of consentIds) {
      const consent = getConsent(id);
      if (consent) {
        consents.push(consent);
      }
    }

    return consents;
  } catch (e) {
    console.warn("Failed to parse user consents index from localStorage:", e);
    return [];
  }
}

/**
 * Check if a consent exists and is valid for the given type
 */
export function checkConsent(consentType: ConsentType): boolean {
  return getUserConsent(consentType) !== null;
}

/**
 * Complete pending consent by saving it with real consentID after redirect
 * Looks for pending consent data, saves the full consent, and cleans up
 */
export function completePendingConsent(
  consentID: string,
  consentType: ConsentType,
  mobileNo?: string | null,
  consentCreationData?: string | null
): ConsentData | null {
  if (typeof window === "undefined") return null;

  // Look for pending consent by checking all pending consent keys
  let pendingConsentData = null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("moneyone:pending-consent:")) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.consentType === consentType) {
            pendingConsentData = parsed;
            // Clean up the pending consent
            localStorage.removeItem(key);
            break;
          }
        } catch (e) {
          console.warn("Failed to parse pending consent data, skipping:", key, e);
          continue;
        }
      }
    }
  }

  // Save the consent with real consentID
  const consentData: ConsentData = {
    consentID: consentID,
    consentCreationData: consentCreationData || pendingConsentData?.consentCreationData || new Date().toISOString(),
    consentExpiry: pendingConsentData?.consentExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    userId: pendingConsentData?.userId || getUserId(),
    isDataReady: false,
    type: consentType,
    name: pendingConsentData?.name || null,
    mobileNo: mobileNo || pendingConsentData?.mobileNo || "",
  };

  saveConsent(consentData);
  console.log("Completed pending consent with real consentID:", consentID);

  return consentData;
}
