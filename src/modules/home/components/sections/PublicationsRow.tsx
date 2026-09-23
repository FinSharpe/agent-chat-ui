"use client";

import { SectionLabel } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { RESEARCH_ARTICLES, type ResearchArticle } from "../../constants/learn";

/**
 * FinSharpe Publications — the reference's `PublicationFeed` anatomy (portrait
 * photo card, category chip top-left, serif title over a lower scrim) over
 * finsharpe-mobile's curated list of real articles. One card per swipe on
 * mobile, two per view on desktop.
 *
 * A card opens the reference's Reader popup (`PublicationReader`), which
 * links out to the original on Moneycontrol, Medium or LinkedIn.
 */
export function PublicationsRow({
  onOpen,
}: {
  onOpen: (article: ResearchArticle) => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <section className="space-y-3 select-none">
      <SectionLabel className="pl-1">FinSharpe Publications</SectionLabel>
      <div
        className={`scrollbar-none flex snap-x snap-mandatory overflow-x-auto pb-1 ${isDesktopWeb ? "gap-4.5" : "gap-3"}`}
      >
        {RESEARCH_ARTICLES.map((article) => (
          <PublicationCard
            key={article.url}
            article={article}
            wide={isDesktopWeb}
            onOpen={() => onOpen(article)}
          />
        ))}
      </div>
    </section>
  );
}

function PublicationCard({
  article,
  wide,
  onOpen,
}: {
  article: ResearchArticle;
  wide: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${article.title}. ${article.category}, ${article.source}.`}
      className={`group/media relative flex shrink-0 snap-start items-end overflow-hidden rounded-[20px] text-left ${
        wide
          ? "aspect-[0.8988] w-[calc(50%-9px)]"
          : "aspect-[4/5] max-h-[430px] w-full"
      }`}
      style={{ background: article.fill }}
    >
      <img
        src={article.cover}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
      />
      {/* Lower scrim over the covers' quiet navy band, so the title reads. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.1)_45%,transparent_75%)]" />

      <span className="absolute top-3.5 left-3.5 rounded-full bg-white/20 px-2.5 py-1 text-[9.5px] tracking-[0.12em] text-white/90 uppercase backdrop-blur-sm">
        {article.category}
      </span>

      <div className="relative space-y-1.5 p-5">
        <p className="v3-display line-clamp-3 text-[22px] leading-[1.18] text-white">
          {article.title}
        </p>
        <p className="pt-0.5 text-[11.5px] text-white/70">
          Read · {article.source}
        </p>
      </div>
    </button>
  );
}
