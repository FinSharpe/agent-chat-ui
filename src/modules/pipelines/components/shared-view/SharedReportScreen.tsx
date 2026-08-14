"use client";

import Link from "next/link";
import { Download, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PipelineApiError,
  sharedReportPdfUrl,
} from "../../api/pipelines-client";
import { formatTimestamp } from "../../constants/presentation";
import { useSharedReport } from "../../hooks/usePipelineQueries";
import { targetSymbol } from "../../utils/report";
import { ReportDocumentView } from "../report/ReportDocumentView";

/**
 * The public share view.
 *
 * Its reader has no account and no navigation, so the page carries its own
 * chrome and never assumes a session. It shows the *same* frozen document as
 * the owner's page — a shared report is not a preview — with the disclaimer
 * and the per-source vintages permanently in place: this reader has no other
 * way to learn how old the report is or what it does not claim.
 */
export function SharedReportScreen({ token }: { token: string }) {
  const { data, isLoading, error } = useSharedReport(token);
  const document = data?.document;
  const symbol = document ? targetSymbol(document.target) : "";

  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border-default bg-bg-card border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link
            href="/"
            className="text-text-primary text-sm font-semibold"
          >
            FinSharpe
          </Link>
          <div className="flex items-center gap-2">
            {document && (
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <a href={sharedReportPdfUrl(token)}>
                  <Download className="size-4" />
                  PDF
                </a>
              </Button>
            )}
            <Button
              asChild
              size="sm"
            >
              <Link href="/register">Get your own report</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {error && (
          <div className="border-border-default bg-bg-card rounded-xl border px-6 py-10 text-center">
            <h1 className="text-text-primary text-lg font-medium">
              {error instanceof PipelineApiError && error.isNotFound
                ? "This link is no longer active"
                : "This report could not be loaded"}
            </h1>
            <p className="text-text-secondary mx-auto mt-2 max-w-md text-sm">
              {error instanceof PipelineApiError && error.isNotFound
                ? "Whoever shared this report has revoked the link, or it never existed."
                : "Please try again in a moment."}
            </p>
            <Button
              asChild
              className="mt-5"
            >
              <Link href="/register">Explore FinSharpe</Link>
            </Button>
          </div>
        )}

        {document && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-text-primary text-2xl font-semibold">
                  {symbol ? `${symbol} — research report` : "Research report"}
                </h1>
                <p className="text-text-secondary mt-1 text-sm">
                  Published {formatTimestamp(document.published_at)} · shared
                  with you as a frozen document
                </p>
              </div>
              {typeof data?.view_count === "number" && (
                <p className="text-text-tertiary flex items-center gap-1.5 text-xs">
                  <Eye className="size-3.5" />
                  {data.view_count} {data.view_count === 1 ? "view" : "views"}
                </p>
              )}
            </div>

            <ReportDocumentView
              document={document}
              disclaimer={data?.disclaimer}
            />

            <section className="border-border-default bg-bg-card rounded-xl border px-6 py-8 text-center">
              <h2 className="text-text-primary text-base font-medium">
                Commission a report like this one
              </h2>
              <p className="text-text-secondary mx-auto mt-1 max-w-lg text-sm">
                Every section is produced from data fetched for that report and
                frozen at publish — so it says the same thing whenever you come
                back to it.
              </p>
              <Button
                asChild
                className="mt-4"
              >
                <Link href="/register">Create an account</Link>
              </Button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
