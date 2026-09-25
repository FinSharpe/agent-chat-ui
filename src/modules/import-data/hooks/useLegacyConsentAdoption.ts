"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  LEGACY_CONSENT_PREFIX,
  LEGACY_USER_ID_KEY,
  purgeLegacyConsentStore,
} from "@/lib/legacy-consent-store";
import { AaError, resolveConsent } from "../api/aa-client";
import { isAaConsentType, type AaConsentType } from "../types/aa";
import { AA_CONSENTS_KEY } from "./useAaPortfolio";

/**
 * One-shot migration of consents the old direct-to-MoneyOne web build kept in
 * this browser's localStorage.
 *
 * We ADOPT rather than ask people to reconnect: the backend's `resolve`
 * explicitly supports the `consentID` + `mobileNo` + `accountID` mode for
 * exactly this ("link an already-ACTIVE consent … no browser round-trip", and
 * `CreateConsentBody.accountID` is documented as "for resuming a consent
 * discovered under a different accountID (e.g. created on web)"). The old
 * store holds all three fields, so the mandate the user already approved at the
 * AA keeps working instead of costing them another OneMoney OTP round-trip.
 *
 * Keys are deleted as they are adopted — and a consent the backend refuses
 * outright is deleted too, because retrying it on every page load would never
 * do anything different. Their absence is the "migration done" flag, so no
 * marker of our own is left in browser storage. The keys, and what else
 * removes them, are in `lib/legacy-consent-store.ts`.
 */

interface LegacyConsent {
  consentID: string;
  type: AaConsentType;
  mobileNo: string;
  accountID: string;
  storageKey: string;
}

function readLegacyConsents(): LegacyConsent[] {
  if (typeof window === "undefined") return [];
  const accountID = localStorage.getItem(LEGACY_USER_ID_KEY) ?? "";
  const found: LegacyConsent[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(LEGACY_CONSENT_PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as {
        consentID?: string;
        type?: string;
        mobileNo?: string;
        userId?: string;
      };
      if (!parsed.consentID || !isAaConsentType(parsed.type)) continue;
      found.push({
        consentID: parsed.consentID,
        type: parsed.type,
        mobileNo: parsed.mobileNo ?? "",
        accountID: parsed.userId || accountID,
        storageKey: key,
      });
    } catch {
      // Unparseable row — drop it, it can't be adopted either way.
      localStorage.removeItem(key);
    }
  }
  return found;
}

export function useLegacyConsentAdoption(enabled: boolean) {
  const queryClient = useQueryClient();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!enabled || ranRef.current) return;
    ranRef.current = true;

    const legacy = readLegacyConsents();
    if (legacy.length === 0) {
      // Nothing to adopt, but sweep any orphaned index/pending keys away.
      purgeLegacyConsentStore();
      return;
    }

    let cancelled = false;

    void (async () => {
      let adopted = 0;
      let transientFailure = false;

      for (const consent of legacy) {
        if (cancelled) return;
        try {
          const result = await resolveConsent({
            type: consent.type,
            consentID: consent.consentID,
            mobileNo: consent.mobileNo || null,
            accountID: consent.accountID || null,
          });
          if (result.status === "linked") adopted++;
          localStorage.removeItem(consent.storageKey);
        } catch (error) {
          // A network failure, a rate limit or a server error is worth another
          // page load; a refusal (404 not found, 409 someone else's, 422)
          // never becomes an adoption, so only those drop the consent.
          const status = (error as AaError)?.status;
          if (
            (error as AaError)?.kind === "transient" &&
            (status === 0 || status === 429 || status >= 500)
          ) {
            transientFailure = true;
          } else {
            localStorage.removeItem(consent.storageKey);
          }
        }
      }

      if (!transientFailure) purgeLegacyConsentStore();
      if (adopted > 0 && !cancelled) {
        queryClient.invalidateQueries({ queryKey: AA_CONSENTS_KEY });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, queryClient]);
}
