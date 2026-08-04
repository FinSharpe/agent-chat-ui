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
}

export function CitationProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [ArtifactContent, { open, setOpen }] = useArtifact();
  const [state, setState] = useState<ViewerState | null>(null);

  const openViewer = useCallback(
    (passages: Citation[], number?: number) => {
      if (passages.length === 0) return;
      setState({ passages, number });
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
            className="flex h-[90vh] max-w-[95vw] flex-col overflow-hidden p-0"
            showCloseButton={false}
          >
            <DialogHeader className="grid grid-cols-[1fr_auto] items-center border-b p-4 text-left">
              <DialogTitle className="truncate text-base">{title}</DialogTitle>
              <button
                onClick={() => setOpen(false)}
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                <XIcon className="size-5" />
                <span className="sr-only">Close</span>
              </button>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden">
              <FilingViewer
                passages={state.passages}
                number={state.number}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {state && filing && !isMobile && (
        <ArtifactContent
          title={
            <div className="min-w-0">
              <p className="truncate font-medium">{title}</p>
              <p className="text-muted-foreground truncate text-xs">
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
