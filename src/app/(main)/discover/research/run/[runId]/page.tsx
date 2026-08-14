"use client";

import { useParams, useSearchParams } from "next/navigation";

import { RunScreen } from "@/modules/pipelines";

export default function ResearchRunRoutePage() {
  const params = useParams<{ runId: string }>();
  const search = useSearchParams();

  return (
    <RunScreen
      runId={params.runId}
      // The run status carries no target, so the symbol rides the URL from the
      // purchase. It only ever labels the page — nothing depends on it.
      symbol={search.get("symbol") ?? ""}
    />
  );
}
