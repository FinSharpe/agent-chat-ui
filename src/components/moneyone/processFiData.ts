import { getAllFiData } from "@/lib/moneyone/moneyone.actions";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { FiDataResponse, Holding } from "@/lib/moneyone/moneyone.types";

export async function processFiData(
  consentId: string,
  consentType: ConsentType,
  waitTime?: number
): Promise<{ holdings: Holding[]; rawData: FiDataResponse }> {
  const response = await getAllFiData(consentId, waitTime);
  if ("error" in response) throw response;

  const holdings = response
    .filter((a) => a.fiType === consentType)
    .flatMap((a) => a.Summary?.Investment.Holdings.Holding || []);

  return {
    holdings,
    rawData: response,
  };
}
