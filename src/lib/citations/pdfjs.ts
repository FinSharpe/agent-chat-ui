/**
 * Loading pdf.js on demand.
 *
 * Fetched from a CDN at runtime rather than bundled: the library ships as an
 * ESM build with a separate worker entry point, and pulling it through the
 * bundler means webpack config for a viewer that most sessions never open. The
 * load is shared, so a second citation click costs nothing.
 */

const PDFJS_VERSION = "4.0.379";
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

/** The slice of the pdf.js surface this app uses. */
export interface PdfPage {
  getViewport(options: { scale: number }): { width: number; height: number };
  render(options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }): { promise: Promise<void>; cancel(): void };
}

export interface PdfDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
  destroy(): Promise<void>;
}

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(options: { data: Uint8Array }): { promise: Promise<PdfDocument> };
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
  }
}

let loading: Promise<PdfJsLib> | null = null;

function injectScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PDFJS_BASE}/pdf.min.mjs`;
    script.type = "module";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the PDF viewer."));
    document.head.appendChild(script);
  });
}

/** Wait for the module script to publish `window.pdfjsLib`. */
async function waitForLib(): Promise<PdfJsLib> {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (window.pdfjsLib) return window.pdfjsLib;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Failed to load the PDF viewer.");
}

export function loadPdfJs(): Promise<PdfJsLib> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("The PDF viewer needs a browser."));
  }
  if (!loading) {
    loading = (async () => {
      if (!window.pdfjsLib) await injectScript();
      const lib = await waitForLib();
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
      return lib;
    })().catch((error) => {
      // Let the next attempt retry rather than caching the failure.
      loading = null;
      throw error;
    });
  }
  return loading;
}
