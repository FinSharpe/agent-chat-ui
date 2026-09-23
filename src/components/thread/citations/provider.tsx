"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { XIcon } from "lucide-react";

import { useArtifact } from "@/components/thread/artifact";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  citationDisplayName,
  citationMeta,
  type Citation,
} from "@/lib/citations";

import { FilingViewer } from "./filing-viewer";

/**
 * Where a citation opens.
 *
 * The desktop artifact panel and the mobile-width dialog are both reasonable
 * homes for a source document, and which one you get is a question about the
 * viewport rather than about the citation — so the choice is made here, once,
 * and neither the chip nor the footer row knows about it.
 */

interface CitationViewerApi {
  /** Open the viewer on one passage (a chip) or a filing's passages (a footer row). */
  open: (passages: Citation[], number?: number) => void;
}

const CitationViewerContext = createContext<CitationViewerApi | null>(null);

interface ViewerState {
  passages: Citation[];
  number?: number;
  /**
   * Counts opens, not citations.
   *
   * Two chips into the same filing leave the viewer showing one already-loaded
   * document, so nothing about the document identifies the *request* — and the
   * page the viewer is on has to follow the click even when the click asks for
   * a page the reader has already navigated away from by hand.
   */
  requestId: number;
}

export function CitationProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [ArtifactContent, { open, setOpen }] = useArtifact();
  const [state, setState] = useState<ViewerState | null>(null);

  const openViewer = useCallback(
    (passages: Citation[], number?: number) => {
      if (passages.length === 0) return;
      setState((previous) => ({
        passages,
        number,
        requestId: (previous?.requestId ?? 0) + 1,
      }));
      setOpen(true);
    },
    [setOpen],
  );

  const filing = state?.passages[0];
  const title = filing ? citationDisplayName(filing) : "";

  return (
    <CitationViewerContext.Provider value={{ open: openViewer }}>
      {children}

      {state && filing && isMobile && (
        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogContent
            className="glass-card rounded-card font-funnel flex h-[90vh] max-w-[95vw] flex-col gap-0 overflow-hidden p-0"
            showCloseButton={false}
          >
            {/* Reference popup header: title left, round close right. */}
            <DialogHeader className="grid h-[56px] shrink-0 grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-50 px-5 text-left">
              <DialogTitle className="font-geist truncate text-sm font-medium text-[#0A1F4D]">
                {title}
              </DialogTitle>
              <button
                onClick={() => setOpen(false)}
                className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
              >
                <XIcon size={15} />
                <span className="sr-only">Close</span>
              </button>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden">
              <FilingViewer
                passages={state.passages}
                number={state.number}
                requestId={state.requestId}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {state && filing && !isMobile && (
        <ArtifactContent
          title={
            <div className="min-w-0">
              <p className="font-geist truncate text-sm font-medium text-[#0A1F4D]">
                {title}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {citationMeta(filing, {
                  withPage: state.passages.length === 1,
                })}
              </p>
            </div>
          }
        >
          <FilingViewer
            passages={state.passages}
            number={state.number}
            requestId={state.requestId}
          />
        </ArtifactContent>
      )}
    </CitationViewerContext.Provider>
  );
}

/**
 * Opening the viewer. Returns null outside a {@link CitationProvider} so a
 * surface that renders citations in an unusual place degrades to inert chips
 * rather than throwing.
 */
export function useCitationViewer(): CitationViewerApi | null {
  return useContext(CitationViewerContext);
}
