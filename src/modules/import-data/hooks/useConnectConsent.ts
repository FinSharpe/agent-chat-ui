"use client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  AaError,
  createConsent,
  discoverConsents,
  resolveConsent,
} from "../api/aa-client";
import type { AaConsentType, DiscoveredConsent } from "../types/aa";
import { writePendingJourney } from "../utils/aa-pending";
import { useConsentsQuery } from "./useAaPortfolio";

/**
 * The connect ladder, web edition. Mirrors finsharpe-mobile's
 * `ConsentFlowController` minus the mobile-only legs (Custom Tab, App Link,
 * lifecycle poll): on the web the browser simply navigates to OneMoney and
 * comes back to `/app/consent-return`, where `useConsentReturn` picks it up.
 */
export type ConnectPhase =
  | "form"
  | "discovering"
  | "resume"
  | "launching"
  | "linking"
  | "failed";

export interface ConnectState {
  phase: ConnectPhase;
  discovered: DiscoveredConsent[];
  error: string | null;
}

const INITIAL: ConnectState = { phase: "form", discovered: [], error: null };

export function useConnectConsent(type: AaConsentType) {
  const [state, setState] = useState<ConnectState>(INITIAL);
  const { data: linkedConsents } = useConsentsQuery();

  const reset = useCallback(() => setState(INITIAL), []);

  /** Send the browser to OneMoney, recording the journey so the return knows it. */
  const launch = useCallback(
    async (input: {
      mobileNo: string;
      pan: string;
      consentHandle?: string | null;
      accountID?: string | null;
    }) => {
      setState((s) => ({ ...s, phase: "launching", error: null }));
      try {
        const created = await createConsent({
          type,
          mobileNo: input.mobileNo,
          pan: input.pan.toUpperCase(),
          consentHandle: input.consentHandle ?? null,
          accountID: input.accountID || null,
        });

        writePendingJourney({
          type,
          consentHandle: created.consentHandle,
          accountID: created.accountID,
          mobileNo: input.mobileNo,
          startedAt: Date.now(),
        });

        window.location.href = created.webRedirectionUrl;
      } catch (error) {
        setState({
          phase: "failed",
          discovered: [],
          error:
            (error as AaError)?.message ??
            "Could not open the Account Aggregator page.",
        });
      }
    },
    [type],
  );

  /**
   * Step one: look for consents this mobile number already has at the AA, so a
   * half-finished approval is resumed rather than stacked. Discovery is
   * best-effort sugar — any failure falls straight through to a fresh consent.
   */
  const submitForm = useCallback(
    async (input: { mobileNo: string; pan: string }) => {
      setState({ phase: "discovering", discovered: [], error: null });

      let discovered: DiscoveredConsent[] = [];
      try {
        discovered = await discoverConsents(type, input.mobileNo);
      } catch {
        discovered = [];
      }

      // Anything already linked on this account is not a candidate.
      const linked = new Set(
        (linkedConsents ?? []).map((c) => c.consentID),
      );
      discovered = discovered.filter(
        (d) => !d.consentID || !linked.has(d.consentID),
      );

      if (discovered.length === 0) {
        await launch(input);
        return;
      }
      setState({ phase: "resume", discovered, error: null });
    },
    [type, linkedConsents, launch],
  );

  /**
   * An already-ACTIVE consent found by discovery: link it straight through
   * `resolve`, with no browser round-trip at all.
   */
  const connectActive = useCallback(
    async (consent: DiscoveredConsent, mobileNo: string) => {
      setState((s) => ({ ...s, phase: "linking", error: null }));
      try {
        const result = await resolveConsent({
          type,
          consentID: consent.consentID,
          consentHandle: consent.consentHandle,
          mobileNo,
          accountID: consent.accountID || null,
        });
        if (result.status === "linked") return result;
        setState({
          phase: "failed",
          discovered: [],
          error:
            result.message ??
            "Approval not finished yet. Complete it on the OneMoney page.",
        });
        return result;
      } catch (error) {
        const message =
          (error as AaError)?.message ??
          "The Account Aggregator could not be reached.";
        setState({ phase: "failed", discovered: [], error: message });
        toast.error(message);
        return null;
      }
    },
    [type],
  );

  return { state, submitForm, launch, connectActive, reset };
}
