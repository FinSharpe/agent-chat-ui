"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Eye } from "lucide-react";

import SectionErrorState from "@/components/shared/SectionErrorState";
import { cn } from "@/lib/utils";
import { AppViewport } from "@/modules/shell";
import { sharedReportPdfUrl } from "../../api/pipelines-client";
import { formatTimestamp } from "../../constants/presentation";
import { useSharedReport } from "../../hooks/usePipelineQueries";
import { sharedReportErrorCopy, sharedReportIsGone } from "../../utils/errors";
import { targetLabel } from "../../utils/target";
import { ReportDocumentView } from "../report/ReportDocumentView";
import {
  CIRCLE_BUTTON,
  Label,
  Placeholder,
  PRIMARY_BUTTON,
} from "../shared/kit";

const CTA_PILL =
  "bg-brand-gradient flex h-8 items-center rounded-full px-3.5 text-[10.5px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110";

/**
 * The public share view.
 *
 * Its reader has no account and no navigation, so the page carries its own
 * chrome and never assumes a session — but it is drawn inside the same
 * viewport frame as the app, so the type scale, colours and desktop scaling
 * match the report its owner sees. It shows the *same* frozen document — a
 * shared report is not a preview — with the disclaimer and the per-source
 * vintages permanently in place: this reader has no other way to learn how old
 * the report is or what it does not claim.
 */
export function SharedReportScreen({ token }: { token: string }) {
  const { data, isLoading, isError, error, isFetching, refetch } =
    useSharedReport(token);
  const document = data?.document;
  const about = document ? targetLabel(document.target) : "";
  // A dead link and a dead server look identical from here unless we insist
  // they don't: only 404/410 may say the link is finished.
  const gone = sharedReportIsGone(error);
  const errorCopy = sharedReportErrorCopy(error);

  return (
    <AppViewport>
      <div className="font-funnel flex h-full flex-col overflow-hidden bg-transparent">
        <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-slate-50 bg-white px-5">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo/Finsharpe Logo - Icon.svg"
              alt="FinSharpe"
              width={22}
              height={22}
              className="h-[22px] w-[22px]"
              priority
            />
            <span className="font-geist text-[13px] font-medium tracking-tight text-[#0A1F4D]">
              FinSharpe<span className="text-[#063BAA]">GPT</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {document && (
              <a
                href={sharedReportPdfUrl(token)}
                className={CIRCLE_BUTTON}
                title="Download PDF"
                aria-label="Download PDF"
              >
                <Download size={14} />
              </a>
            )}
            <Link
              href="/register"
              className={CTA_PILL}
            >
              Get your own report
            </Link>
          </div>
        </header>

        <div className="scrollbar-none flex-1 overflow-y-auto">
          <main className="mx-auto w-full max-w-[calc(804px*var(--wx,1))] space-y-5 px-5 pt-6 pb-16">
            {isLoading && (
              <div className="space-y-4">
                <Placeholder className="h-10 w-64" />
                <Placeholder className="rounded-card h-[200px] w-full" />
                <Placeholder className="rounded-card h-64 w-full" />
              </div>
            )}

            {/* The link is finished: a real answer, and the only one that
                gets the sign-up route out of a dead end. */}
            {isError && gone && (
              <div className="space-y-2 py-16 text-center">
                <h1 className="font-geist text-base font-medium text-[#0A1F4D] dark:text-white">
                  {errorCopy.title}
                </h1>
                <p className="mx-auto max-w-md text-[11px] leading-relaxed text-slate-500">
                  {errorCopy.description}
                </p>
                <Link
                  href="/register"
                  className={cn(PRIMARY_BUTTON, "mx-auto mt-5 w-fit px-6")}
                >
                  Explore FinSharpe
                </Link>
              </div>
            )}

            {/* We never reached the server. This reader has no account to
                blame and nothing else to try, so the page keeps the link
                alive, says the report is still there, and hands them the one
                action that can help — no sign-up wall, no sign-in. */}
            {isError && !gone && (
              <SectionErrorState
                className="py-16"
                title={errorCopy.title}
                description={errorCopy.description}
                onRetry={() => refetch()}
                retrying={isFetching}
              />
            )}

            {document && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-1">
                    <Label>Shared research report</Label>
                    <h1 className="font-geist text-base font-medium text-[#0A1F4D] dark:text-white">
                      {about ? `${about} Research Report` : "Research Report"}
                    </h1>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Published {formatTimestamp(document.published_at)} ·
                      shared with you as a frozen document
                    </p>
                  </div>
                  {typeof data?.view_count === "number" && (
                    <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Eye size={12} />
                      {data.view_count}{" "}
                      {data.view_count === 1 ? "view" : "views"}
                    </p>
                  )}
                </div>

                <ReportDocumentView
                  document={document}
                  disclaimer={data?.disclaimer}
                />

                <section className="glass-card rounded-card space-y-3 px-6 py-8 text-center">
                  <h2 className="font-geist text-sm font-medium text-[#0A1F4D] dark:text-white">
                    Commission a report like this one
                  </h2>
                  <p className="mx-auto max-w-lg text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Every section is produced from data fetched for that report
                    and frozen at publish — so it says the same thing whenever
                    you come back to it.
                  </p>
                  <Link
                    href="/register"
                    className={cn(PRIMARY_BUTTON, "mx-auto w-fit px-6")}
                  >
                    Create an account
                  </Link>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </AppViewport>
  );
}
