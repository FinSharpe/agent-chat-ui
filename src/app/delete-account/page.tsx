import type { Metadata } from "next";
import { DeleteAccountPage } from "@/modules/account-deletion";

export const metadata: Metadata = {
  title: "Delete your FinSharpe account",
  description:
    "How to delete your FinSharpe account, what is deleted, and what is kept and for how long.",
};

export default async function DeleteAccountRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { deleted } = await searchParams;
  return <DeleteAccountPage justDeleted={deleted === "1"} />;
}
