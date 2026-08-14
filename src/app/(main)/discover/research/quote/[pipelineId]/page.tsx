"use client";

import { useParams, useSearchParams } from "next/navigation";

import { QuoteScreen } from "@/modules/pipelines";

export default function ResearchQuoteRoutePage() {
  const params = useParams<{ pipelineId: string }>();
  const search = useSearchParams();

  return (
    <QuoteScreen
      pipelineId={params.pipelineId}
      symbol={search.get("symbol")}
      // Carried through when the flow was entered from a chat thread, so the
      // Summary Card lands back there at publish. Absent otherwise, which is
      // a purchase made outside chat and skips delivery by design.
      threadId={search.get("threadId")}
    />
  );
}
