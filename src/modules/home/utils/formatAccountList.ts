import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { ACCOUNT_LABELS } from "../constants/linkedAccounts";

/** "Demat", "Demat & mutual funds", "Demat, ETFs & SIPs" — sentence-cased. */
export function formatAccountList(types: ConsentType[]): string {
  const names = types.map((t) => ACCOUNT_LABELS[t].name);
  const text =
    names.length <= 1
      ? (names[0] ?? "")
      : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
