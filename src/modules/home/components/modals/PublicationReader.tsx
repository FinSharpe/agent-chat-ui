"use client";

import { ArrowUpRight, X } from "lucide-react";
import { OverlayRoot } from "@/components/shared/Popup";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import type { ResearchArticle } from "../../constants/learn";

/**
 * The reference's publication `Reader` (v3/PublicationFeed): category eyebrow
 * and a round close, then the title, meta line, cover and a rule — a popup on
 * desktop, a full-screen sheet over Home on mobile with the cover full-bleed
 * on top.
 *
 * The reference followed the rule with the article's body. We hold none of
 * these pieces' text, so where the publisher allows framing
 * (`article.embeddable`) the popup shows the live article under the header;
 * otherwise the meta line is the publisher alone and the body is replaced by
 * a link to the original.
 */
export function PublicationReader({
  article,
  onClose,
}: {
  article: ResearchArticle;
  onClose: () => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();

  const hero = (cls: string) => (
    <div
      className={`group/media relative overflow-hidden ${cls}`}
      style={{ background: article.fill }}
    >
      <img
        src={article.cover}
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
      />
    </div>
  );

  const head = (
    <>
      <h2 className="v3-display text-[27px] leading-[1.2] text-[#0A1F4D]">
        {article.title}
      </h2>
      <p className="text-[12px] text-slate-400">{article.source}</p>
    </>
  );

  const body = (
    <>
      <p className="text-[14.5px] leading-[1.7] text-slate-500">
        The full piece is published on {article.source}.
      </p>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-brand-gradient inline-flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-[12px] font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Read full article
        <ArrowUpRight size={14} />
        <span className="sr-only">(opens {article.source} in a new tab)</span>
      </a>
    </>
  );

  return (
    <OverlayRoot
      onClose={onClose}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      aria-label={article.title}
      className="absolute inset-0 z-[75] flex flex-col overflow-hidden bg-[var(--card-bg)]"
    >
      <div className="flex h-[56px] shrink-0 items-center justify-between gap-3 px-5">
        <span className="v3-eyebrow">{article.category}</span>
        <div className="flex items-center gap-2">
          {article.embeddable && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-tint inline-flex h-8 items-center gap-1 rounded-full border border-slate-100 px-3 text-[11px] font-medium text-[#0A1F4D] transition-colors"
            >
              {article.source}
              <ArrowUpRight size={13} />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {article.embeddable ? (
        <iframe
          src={article.url}
          title={article.title}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="min-h-0 w-full flex-1 border-t border-slate-100 bg-white"
        />
      ) : (
        <div className="scrollbar-none flex-1 overflow-y-auto pb-10">
          {isDesktopWeb ? (
            <div className="space-y-5 px-8 pt-7 pb-8">
              {head}
              {hero("rounded-card h-[300px]")}
              <div className="v3-rule" />
              {body}
            </div>
          ) : (
            <>
              {hero("h-[240px]")}
              <div className="mx-auto w-full max-w-[calc(720px*var(--wx,1))] space-y-4 px-6 pt-7">
                {head}
                <div className="v3-rule" />
                {body}
              </div>
            </>
          )}
        </div>
      )}
    </OverlayRoot>
  );
}
