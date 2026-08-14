"use client";

import { useParams } from "next/navigation";

import { ReportScreen } from "@/modules/pipelines";

export default function ResearchReportRoutePage() {
  const params = useParams<{ runId: string }>();
  return <ReportScreen runId={params.runId} />;
}
