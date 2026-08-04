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

import { Button } from "@/components/ui/button";
import {
  citationDisplayName,
  citationMeta,
  highlightsFor,
  type Citation,
} from "@/lib/citations";
import { loadFilingPdf } from "@/lib/citations/filings-pdf";
import { loadPdfJs, type PdfDocument } from "@/lib/citations/pdfjs";
import { cn } from "@/lib/utils";

/**
 * The filing behind a citation: the passage first, the document underneath.
 *
 * The verbatim quote and the filing's identity come off the registry with no
 * network call, so they render immediately — which is what makes a chip worth
 * clicking before the PDF has arrived. The document resolves underneath and a
 * failed fetch leaves the quote standing with a calm error rather than a blank
 * viewer.
 *
 * `passages` is one entry when a chip opened this, and every passage the turn
 * drew from a filing when a footer row did.
 */
export function FilingViewer({
  passages,
  number,
}: {
  passages: Citation[];
  number?: number;
}) {
  const filing = passages[0];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <PassagePanel
        passages={passages}
        number={number}
      />
      <PdfPanel
        filing={filing}
        passages={passages}
      />
    </div>
  );
}

function PassagePanel({
  passages,
  number,
}: {
  passages: Citation[];
  number?: number;
}) {
  const filing = passages[0];
  const many = passages.length > 1;

  return (
    <div className="shrink-0 border-b px-4 py-4">
      <div className="flex items-start gap-2">
        {number != null && (
          <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-50 px-1.5 text-xs font-semibold text-blue-700 tabular-nums dark:bg-blue-950 dark:text-blue-300">
            {number}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {citationDisplayName(filing)}
          </p>
          {/* The header describes the filing; each passage carries its own page below. */}
          <p className="text-muted-foreground text-xs">
            {citationMeta(filing, { withPage: !many })}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {passages.map((passage) => (
          <blockquote
            key={passage.cite}
            className="bg-muted/50 rounded-md border-l-2 border-blue-500 py-2.5 pr-3 pl-3.5"
          >
            {many && passage.page != null && (
              <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wide uppercase">
                Page {passage.page}
              </p>
            )}
            <p className="text-[13px] leading-relaxed">{passage.quote}</p>
          </blockquote>
        ))}
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        {many
          ? "Verbatim from the filing — the passages this answer drew on."
          : "Verbatim from the filing."}
      </p>
    </div>
  );
}

function PdfPanel({
  filing,
  passages,
}: {
  filing: Citation;
  passages: Citation[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [numPages, setNumPages] = useState(0);
  // A citation with no page opens the document at its first page.
  const citedPage = filing.page ?? 1;
  const [page, setPage] = useState(citedPage);
  const [scale, setScale] = useState(1.2);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDocument | null = null;

    (async () => {
      try {
        const [lib, bytes] = await Promise.all([
          loadPdfJs(),
          loadFilingPdf(filing.subcatname, filing.attachmentName),
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
        setNumPages(pdf.numPages);
        setPage(Math.min(Math.max(citedPage, 1), pdf.numPages));
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
  }, [filing.subcatname, filing.attachmentName, citedPage]);

  useEffect(() => {
    if (!doc) return;
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
        Math.min(Math.max(current + delta, 1), numPages || current),
      ),
    [numPages],
  );

  if (error) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-center text-sm">
        <TriangleAlert className="size-5 text-amber-500" />
        <p>{error}</p>
        <p className="text-xs">The passage above is unaffected.</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 px-4 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading the filing…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => step(-1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs tabular-nums">
            Page {page} of {numPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => step(1)}
            disabled={page >= numPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.6))}
            disabled={scale <= 0.6}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-xs tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
            disabled={scale >= 3}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </div>

      <div className="bg-muted/40 flex-1 overflow-auto p-4">
        <div className="relative mx-auto w-fit shadow-sm">
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
