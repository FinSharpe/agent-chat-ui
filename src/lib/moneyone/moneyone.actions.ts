"use server";
import { ReasonPhrases } from "http-status-codes";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { ConsentType } from "./moneyone.enums";
import { moneyOneAuthHeaders } from "./moneyone.headers";
import { webRedirectionDecryptionApiReqParamsSchema } from "./moneyone.schema";
import {
  Consent,
  ConsentRequestResponse,
  ConsentRequestV3Response,
  FiDataResponse,
  FiRequestResponse,
} from "./moneyone.types";
import {
  extractErrorMessage,
  getErrMsgKey,
  isConsentInvalidError,
} from "./moneyone.utils";

const consentFormMap = {
  [ConsentType.EQUITIES]: process.env.MONEY_ONE_EQUITIES_CONSENT_FORM,
  [ConsentType.MUTUAL_FUNDS]: process.env.MONEY_ONE_MUTUAL_FUNDS_CONSENT_FORM,
  [ConsentType.ETF]: process.env.MONEY_ONE_ETF_CONSENT_FORM,
  [ConsentType.BANK_ACCOUNTS]: process.env.MONEY_ONE_BANK_ACCOUNTS_CONSENT_FORM,
  [ConsentType.SIP]: process.env.MONEY_ONE_SIP_CONSENT_FORM,
} as const;

const consentFipIdsMap = {
  [ConsentType.EQUITIES]: process.env.MONEY_ONE_EQUITIES_FIPS
    ? process.env.MONEY_ONE_EQUITIES_FIPS.split(",")
    : null,
  [ConsentType.MUTUAL_FUNDS]: process.env.MONEY_ONE_MUTUAL_FUNDS_FIPS
    ? process.env.MONEY_ONE_MUTUAL_FUNDS_FIPS.split(",")
    : null,
  // ETF FIPS is optional - may not be required by MoneyOne
  [ConsentType.ETF]: process.env.MONEY_ONE_ETF_FIPS
    ? process.env.MONEY_ONE_ETF_FIPS.split(",")
    : null,
  // Bank Accounts FIPS is optional - may not be required by MoneyOne
  [ConsentType.BANK_ACCOUNTS]: process.env.MONEY_ONE_BANK_ACCOUNTS_FIPS
    ? process.env.MONEY_ONE_BANK_ACCOUNTS_FIPS.split(",")
    : null,
  // SIP FIPS is optional - may not be required by MoneyOne
  [ConsentType.SIP]: process.env.MONEY_ONE_SIP_FIPS
    ? process.env.MONEY_ONE_SIP_FIPS.split(",")
    : null,
} as const;

export const createConsentRequest = async (
  mobileNo: string,
  consentType: ConsentType,
  accountID: string, // Browser-unique user ID from localStorage
): Promise<{ error: string } | ConsentRequestResponse> => {
  const body = JSON.stringify({
    partyIdentifierType: "MOBILE",
    partyIdentifierValue: mobileNo,
    productID: consentFormMap[consentType],
    accountID: accountID,
    vua: `${mobileNo}@onemoney`,
  });

  const url = `${process.env.MONEY_ONE_BASE_URL}/v2/requestconsent`;

  try {
    if (process.env.NODE_ENV === "development")
      console.log("---Making consent request ~ body:", body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...moneyOneAuthHeaders,
      },
      body,
    });

    if (!response.ok) {
      if (response.status === 503)
        throw new Error("503 Service Temporarily Unavailable");
      throw await response.json();
    }

    const res: ConsentRequestResponse = await response.json();
    if (process.env.NODE_ENV === "development")
      console.log("---Consent created ~ /v2/requestconsent", res);

    return res;
  } catch (error) {
    console.error("---Error occurred while creating consent", error);

    const message =
      error instanceof Error
        ? error.message
        : extractErrorMessage(error) || ReasonPhrases.INTERNAL_SERVER_ERROR;

    return { error: message };
  }
};

export const createConsentRequestV3 = async (
  mobileNo: string,
  consentType: ConsentType,
  accountID: string,
  pan: string,
  redirectUrl: string,
): Promise<{ error: string } | ConsentRequestV3Response> => {
  const body = JSON.stringify({
    partyIdentifierType: "MOBILE",
    partyIdentifierValue: mobileNo,
    productID: consentFormMap[consentType],
    vua: `${mobileNo}@onemoney`,
    accountID: accountID,
    ...(Boolean(consentFipIdsMap[consentType]) && {
      fipID: consentFipIdsMap[consentType],
    }),
    pan: pan,
    redirectUrl: redirectUrl,
  });

  const url = `${process.env.MONEY_ONE_BASE_URL}/v3/requestconsent`;

  try {
    if (process.env.NODE_ENV === "development")
      console.log("---Making v3 consent request ~ body:", body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...moneyOneAuthHeaders,
      },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      if (process.env.NODE_ENV === "development") {
        console.error("---MoneyOne V3 API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
          requestBody: JSON.parse(body),
          headers: moneyOneAuthHeaders,
        });
      }
      if (response.status === 503)
        throw new Error("503 Service Temporarily Unavailable");
      throw errorBody;
    }

    const res: ConsentRequestV3Response = await response.json();
    if (process.env.NODE_ENV === "development")
      console.log("---Consent created v3 ~ /v3/requestconsent", res);

    return res;
  } catch (error) {
    console.error("---Error occurred while creating v3 consent", error);

    const message =
      error instanceof Error
        ? error.message
        : extractErrorMessage(error) || ReasonPhrases.INTERNAL_SERVER_ERROR;

    return { error: message };
  }
};

/**
 * Revoke a consent on MoneyOne / the Account Aggregator (POST /revokeconsent).
 * This is the real, RBI-AA-compliant teardown — after this the FIP/AA stops
 * sharing the user's data, unlike deleting the consent only from localStorage.
 *
 * If the consent is already gone (already REVOKED, or no longer exists), we
 * return `{ error, alreadyGone: true }` so callers can treat it as a success
 * for the user's intent (the data-sharing mandate is already stopped).
 */
export const revokeConsent = async (
  consentID: string,
): Promise<{ success: true } | { error: string; alreadyGone?: boolean }> => {
  const url = `${process.env.MONEY_ONE_BASE_URL}/revokeconsent`;

  try {
    const body = JSON.stringify({ consentID });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...moneyOneAuthHeaders },
      body,
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.status === "success") {
      if (process.env.NODE_ENV === "development")
        console.log("---Consent revoked ~ /revokeconsent", data);
      return { success: true };
    }

    const errorCode = getErrMsgKey(data, "errorCode");
    const errorMsg =
      getErrMsgKey(data, "errorMsg") ||
      `Revoke failed with status ${response.status}`;

    // "InvalidStatus" => already in REVOKED state; a dead consent => already gone.
    const alreadyGone =
      errorCode === "InvalidStatus" ||
      isConsentInvalidError(errorCode, errorMsg);

    return { error: errorMsg, alreadyGone };
  } catch (e) {
    console.error("---Error occurred while revoking consent", e);
    const message =
      e instanceof Error
        ? e.message
        : extractErrorMessage(e) || ReasonPhrases.INTERNAL_SERVER_ERROR;
    return { error: message };
  }
};

export const getEncryptedUrl = async (
  consentHandle: string,
  redirectUrl: string,
  pan: string,
  consentType: ConsentType,
) => {
  try {
    const fipID = consentFipIdsMap[consentType];
    const body = JSON.stringify({
      consentHandle,
      redirectUrl,
      ...(Boolean(fipID) && {
        fipID,
      }),
      pan,
    });

    const url = `${process.env.MONEY_ONE_BASE_URL}/webRedirection/getEncryptedUrl`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...moneyOneAuthHeaders,
      },
      body,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        getErrMsgKey(errorBody, "errorMsg") ||
        `API call failed with status ${res.status}`,
      );
    }

    const response = await res.json();

    if (response?.status !== "success") {
      throw new Error(
        getErrMsgKey(response, "errorMsg") || "Encrypted URL request failed",
      );
    }
    if (process.env.NODE_ENV === "development")
      console.log("🚀 ~ /webRedirection/getEncryptedUrl ~ response:", response);

    redirect(response.data.webRedirectionUrl);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("---Error occurred while getting encrypted URL", error);
    const message =
      error instanceof Error
        ? error.message
        : extractErrorMessage(error) || ReasonPhrases.INTERNAL_SERVER_ERROR;
    return { error: message };
  }
};

export const getConsentList = async (
  consentHandle: string,
  mobileNo: string,
  consentType: ConsentType,
  accountID: string, // Browser-unique user ID from localStorage
): Promise<Consent | null> => {
  try {
    const body = JSON.stringify({
      partyIdentifierType: "MOBILE",
      partyIdentifierValue: mobileNo,
      productID: consentFormMap[consentType],
      accountID: accountID,
    });

    const url = `${process.env.MONEY_ONE_BASE_URL}/v2/getconsentslist`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...moneyOneAuthHeaders,
      },
      method: "POST",
      body,
    });

    if (!res.ok) {
      console.error("getConsentList: API returned non-OK status", res.status);
      throw new Error(`Consent list API failed with status ${res.status}`);
    }

    const response = await res.json();

    if (response.status === "success" && Array.isArray(response.data)) {
      const consentsList = response.data;
      const consent: Consent = consentsList.find(
        (c: Consent) => c.consentHandle === consentHandle,
      );
      if (!consent) throw new Error("Consent not found");
      if (process.env.NODE_ENV === "development")
        console.log("Consent found in list: ", consent);

      return consent;
    }

    console.error("getConsentList: Unexpected API response", response);
    return null;
  } catch (error) {
    console.error("---Error occurred while fetching consent list", error);
    throw error;
  }
};

/**
 * Live consent status straight from MoneyOne. Use this to authoritatively tell
 * whether a consent is still ACTIVE vs PAUSED/REVOKED/EXPIRED, rather than
 * trusting the locally-cached `consentExpiry` (which is only an estimate).
 *
 * Backed by POST /v2/getconsentslist, matched on consentID.
 */
export type ConsentStatusResult =
  | { status: string; consentExpiry: string | null }
  | { error: string };

export const getConsentStatus = async (
  consentID: string,
  mobileNo: string,
  consentType: ConsentType,
  accountID: string,
): Promise<ConsentStatusResult> => {
  try {
    const body = JSON.stringify({
      partyIdentifierType: "MOBILE",
      partyIdentifierValue: mobileNo,
      productID: consentFormMap[consentType],
      accountID,
    });

    const url = `${process.env.MONEY_ONE_BASE_URL}/v2/getconsentslist`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...moneyOneAuthHeaders },
      body,
    });

    const response = await res.json().catch(() => null);

    if (!res.ok || response?.status !== "success" || !Array.isArray(response.data)) {
      return {
        error:
          getErrMsgKey(response, "errorMsg") ||
          `Consent status API failed with status ${res.status}`,
      };
    }

    const consent = response.data.find(
      (c: { consentID?: string }) => c.consentID === consentID,
    );
    if (!consent) return { error: "Consent not found" };

    return {
      status: consent.status,
      consentExpiry: consent.consent_expiry ?? null,
    };
  } catch (error) {
    console.error("---Error occurred while fetching consent status", error);
    const message =
      error instanceof Error
        ? error.message
        : extractErrorMessage(error) || ReasonPhrases.INTERNAL_SERVER_ERROR;
    return { error: message };
  }
};

export type DecryptUrlResult =
  | { success: true; data: DecryptedUrlData }
  | { success: false; status: "rejected" | "failed"; data: DecryptedUrlData }
  | { success: false; status: "error"; error: string };

export type DecryptedUrlData = {
  status: "S" | "F";
  errorcode: string;
  txnid: string;
  sessionid: string;
  srcref: string;
  userid: string;
  redirect: string;
  email: string | null;
  pan: string | null;
};

export const decryptUrl = async (
  values?: Record<string, string>,
): Promise<DecryptUrlResult> => {
  try {
    const validatedParams =
      webRedirectionDecryptionApiReqParamsSchema.safeParse(values);
    if (!validatedParams.success) {
      return { success: false, status: "error", error: "Invalid parameters" };
    }

    const url = `${process.env.MONEY_ONE_BASE_URL}/webRedirection/decryptUrl`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...moneyOneAuthHeaders,
      },
      body: JSON.stringify({
        webRedirectionURL: validatedParams.data,
      }),
    });

    if (!res.ok) {
      throw new Error(`Decrypt URL API failed with status ${res.status}`);
    }

    const response = await res.json();

    if (process.env.NODE_ENV === "development")
      console.log("🚀 ~ decryptUrl ~ response:", response);

    if (response?.status !== "success") throw response;

    const data: DecryptedUrlData = response?.data;

    if (data?.status === "S") {
      if (process.env.NODE_ENV === "development")
        console.log("---Decrypted data found from url", data);
      return { success: true, data };
    }

    // Consent was rejected or failed (status === 'F')
    if (process.env.NODE_ENV === "development")
      console.log("---Consent rejected/failed:", data);

    // errorcode '1' typically means user rejected the consent
    const status = data?.errorcode === "1" ? "rejected" : "failed";
    return { success: false, status, data };
  } catch (err) {
    console.error("---Error occurred while decrypting url data", err);
    return { success: false, status: "error", error: "Failed to decrypt URL" };
  }
};

export const getAllFiData = async (consentID: string, waitTime?: number) => {
  const url = `${process.env.MONEY_ONE_BASE_URL}/getallfidata`;

  try {
    if (process.env.NODE_ENV === "development")
      console.log("---Fetching fiData for consent id", consentID);

    const body = JSON.stringify({
      consentID,
    });

    if (waitTime && waitTime > 0) {
      if (process.env.NODE_ENV === "development")
        console.log(`---Waiting for ${waitTime}ms before fetching fiData`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...moneyOneAuthHeaders,
      },
      method: "POST",
      body,
    });

    // Always read the body so we can surface the real MoneyOne reason
    // (e.g. errorCode "InvalidConsentId" for an expired/revoked consent)
    // instead of a generic "status 400" that the frontend can't act on.
    const response = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        error:
          getErrMsgKey(response, "errorMsg") ||
          `FI data API failed with status ${res.status}`,
        errorCode: getErrMsgKey(response, "errorCode") ?? undefined,
      };
    }

    if (response?.errorCode === "NoDataFound") {
      return {
        error: getErrMsgKey(response, "errorMsg") || "Data not ready!",
        errorCode: "NoDataFound",
      };
    }

    if (response?.status === "success") {
      if (!response.data.some((item: any) => item.Summary || item.Profile))
        return { error: "Data not ready!", errorCode: "NoDataFound" };
      if (process.env.NODE_ENV === "development")
        console.log("---Fetched fi data", response);
      return response.data as FiDataResponse;
    }

    return {
      error: getErrMsgKey(response, "errorMsg") || "Failed to fetch FI data",
      errorCode: getErrMsgKey(response, "errorCode") ?? undefined,
    };
  } catch (e) {
    console.error("---Error occurred while fetching FI data for consent:", consentID, e);
    const message =
      e instanceof Error
        ? e.message
        : extractErrorMessage(e) || ReasonPhrases.INTERNAL_SERVER_ERROR;
    return { error: message };
  }
};

export const requestFiData = async (
  consentId: string,
): Promise<FiRequestResponse | { error: string; errorCode?: string }> => {
  const url = `${process.env.MONEY_ONE_BASE_URL}/fi/request`;

  try {
    if (process.env.NODE_ENV === "development")
      console.log("---Requesting FI data for consent id", consentId);

    const body = JSON.stringify({
      consentId,
    });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...moneyOneAuthHeaders,
      },
      method: "POST",
      body,
    });

    if (!response.ok) {
      if (response.status === 503)
        return { error: "503 Service Temporarily Unavailable" };
      // Capture the MoneyOne error code (e.g. "InvalidConsentId") so callers
      // can tell an expired/revoked consent from a transient failure.
      const errBody = await response.json().catch(() => null);
      return {
        error:
          getErrMsgKey(errBody, "errorMsg") ||
          `FI request failed with status ${response.status}`,
        errorCode: getErrMsgKey(errBody, "errorCode") ?? undefined,
      };
    }

    const res: FiRequestResponse = await response.json();

    if (res.response !== "ok") {
      throw new Error("FI request failed");
    }

    if (process.env.NODE_ENV === "development")
      console.log("---FI request successful", res);

    return res;
  } catch (e) {
    console.error("---Error occurred while requesting FI data", e);
    const message =
      e instanceof Error
        ? e.message
        : extractErrorMessage(e) || ReasonPhrases.INTERNAL_SERVER_ERROR;
    return { error: message };
  }
};
