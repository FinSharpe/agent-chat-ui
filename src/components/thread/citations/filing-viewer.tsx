"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  TriangleAlert,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  citationDisplayName,
  citationMeta,
  highlightsFor,
  type Citation,
} from "@/lib/citations";
import { loadFilingPdf } from "@/lib/citations/filings-pdf";
import { loadPdfJs, type PdfDocument } from "@/lib/citations/pdfjs";
import { cn } from "@/lib/utils";

/** Round toolbar control, the reference's popup close-button shape. */
const TOOL_BUTTON =
  "hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors disabled:pointer-events-none disabled:opacity-40";

/**
 * The filing behind a citation.
 *
 * The verbatim quote and the filing's identity come off the registry with no
 * network call, so they render the instant the viewer opens — which is what
 * makes a chip worth clicking before the PDF has arrived. They are a
 * **placeholder**: once the document lands, the cited page with the passage
 * highlighted says the same thing better, and the quote panel gives way to it.
 * A failed fetch leaves the quote standing with a calm error, so the click was
 * never wasted.
 *
 * `passages` is one entry when a chip opened this, and every passage the turn
 * drew from a filing when a footer row did.
 */
export function FilingViewer({
  passages,
  number,
  requestId,
}: {
  passages: Citation[];
  number?: number;
  /** Identifies the click, not the citation — see `ViewerState.requestId`. */
  requestId?: number;
}) {
  const filing = passages[0];
  const { doc, error } = useFilingDocument(filing);

  return (
    <div className="font-funnel flex h-full flex-col overflow-hidden">
      {!doc && (
        <PassagePanel
          passages={passages}
          number={number}
          error={error}
        />
      )}
      {doc && (
        <PdfPanel
          doc={doc}
          passages={passages}
          citedPage={filing.page ?? 1}
          requestId={requestId}
        />
      )}
    </div>
  );
}

/** The document itself, or why it could not be shown. */
function useFilingDocument(filing: Citation) {
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { subcatname, attachmentName } = filing;

  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDocument | null = null;
    setDoc(null);
    setError(null);

    (async () => {
      try {
        const [lib, bytes] = await Promise.all([
          loadPdfJs(),
          loadFilingPdf(subcatname, attachmentName),
        ]);
        if (cancelled) return;
        // pdf.js detaches the buffer it is handed, so the cached bytes are
        // copied rather than surrendered.
        const pdf = await lib.getDocument({ data: bytes.slice() }).promise;
        if (cancelled) {
          void pdf.destroy();
          return;
        }
        loaded = pdf;
        setDoc(pdf);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "The filing could not be loaded.",
        );
      }
    })();

    return () => {
      cancelled = true;
      void loaded?.destroy();
    };
  }, [subcatname, attachmentName]);

  return { doc, error };
}

function PassagePanel({
  passages,
  number,
  error,
}: {
  passages: Citation[];
  number?: number;
  error: string | null;
}) {
  const filing = passages[0];
  const many = passages.length > 1;

  return (
    <div className="flex-1 overflow-auto px-5 py-5">
      <div className="flex items-start gap-2.5">
        {number != null && (
          <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#063BAA]/8 px-1.5 text-[11px] font-medium text-[#063BAA] tabular-nums">
            {number}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-geist truncate text-sm font-medium text-[#0A1F4D]">
            {citationDisplayName(filing)}
          </p>
          {/* The header describes the filing; each passage carries its own page below. */}
          <p className="text-[11px] text-slate-400">
            {citationMeta(filing, { withPage: !many })}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {passages.map((passage) => (
          <blockquote
            key={passage.cite}
            className="rounded-nested border-l-2 border-[#063BAA] bg-[#063BAA]/6 py-3 pr-4 pl-4"
          >
            {many && passage.page != null && (
              <p className="mb-1 text-[9px] font-medium tracking-wider text-slate-400 uppercase">
                Page {passage.page}
              </p>
            )}
            <p className="text-[13px] leading-relaxed text-[#0A1F4D]">{passage.quote}</p>
          </blockquote>
        ))}
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-nested bg-amber-500/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-600">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          <span>
            {error} The passage above is what the answer drew on, and is
            unaffected.
          </span>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
          <Loader2 className="size-3.5 animate-spin text-[#063BAA]" />
          Opening the filing at the cited page…
        </div>
      )}
    </div>
  );
}

function PdfPanel({
  doc,
  passages,
  citedPage,
  requestId,
}: {
  doc: PdfDocument;
  passages: Citation[];
  citedPage: number;
  requestId?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  // A citation with no page opens the document at its first page.
  const landingPage = Math.min(Math.max(citedPage, 1), doc.numPages);
  const [page, setPage] = useState(landingPage);
  const [scale, setScale] = useState(1);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  // Every click lands on its own cited page. Two citations into one filing
  // reuse the loaded document and this component with it, so without this the
  // viewer would keep showing whatever page it was left on while the header
  // above it named a different one.
  useEffect(() => {
    setPage(landingPage);
  }, [requestId, landingPage]);

  useEffect(() => {
    let cancelled = false;
    let task: { cancel(): void } | null = null;

    (async () => {
      const pdfPage = await doc.getPage(page);
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (cancelled || !canvas || !context) return;

      const viewport = pdfPage.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setSize({ width: viewport.width, height: viewport.height });

      const render = pdfPage.render({ canvasContext: context, viewport });
      task = render;
      try {
        await render.promise;
      } catch {
        // A cancelled render is the expected outcome of paging or zooming
        // while one is in flight.
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, scale]);

  /** Every rectangle any shown passage carries on the page being rendered. */
  const highlights = useMemo(() => {
    if (!size) return [];
    return passages
      .filter((p) => p.page === page)
      .flatMap((p) =>
        highlightsFor(p.bboxes, p.coordOrigin, size.width, size.height),
      );
  }, [passages, page, size]);

  useEffect(() => {
    if (highlights.length === 0) return;
    highlightRef.current?.scrollIntoView({ block: "center" });
  }, [highlights]);

  const step = useCallback(
    (delta: number) =>
      setPage((current) =>
        Math.min(Math.max(current + delta, 1), doc.numPages),
      ),
    [doc.numPages],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={TOOL_BUTTON}
            onClick={() => step(-1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-[11px] text-slate-500 tabular-nums">
            Page {page} of {doc.numPages}
          </span>
          <button
            type="button"
            className={TOOL_BUTTON}
            onClick={() => step(1)}
            disabled={page >= doc.numPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={TOOL_BUTTON}
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.6))}
            disabled={scale <= 0.6}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="w-9 text-center text-[11px] text-slate-500 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            className={TOOL_BUTTON}
            onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
            disabled={scale >= 3}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-5">
        <div className="premium-shadow-md relative mx-auto w-fit overflow-hidden rounded-tile">
          <canvas
            ref={canvasRef}
            className="block"
          />
          {highlights.map((rect, index) => (
            <div
              key={index}
              ref={index === 0 ? highlightRef : undefined}
              aria-hidden
              className={cn(
                "pointer-events-none absolute rounded-[2px]",
                "border border-amber-400 bg-amber-300/30 mix-blend-multiply",
              )}
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
