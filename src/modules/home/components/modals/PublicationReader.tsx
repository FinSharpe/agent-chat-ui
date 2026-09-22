"use client";

import { X } from "lucide-react";
import { OverlayRoot } from "@/components/shared/Popup";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import type { Publication } from "../../types/home.types";
import { KindMark } from "../shared/KindMark";

function Hero({ p, className }: { p: Publication; className: string }) {
  return (
    <div className={`${className} overflow-hidden group/media`}>
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
        style={{ background: p.gradient }}
      />
      <div className="absolute inset-0 bg-black/10" />
      <span className="relative">
        <KindMark p={p} />
      </span>
      {p.duration && (
        <span className="absolute bottom-3 right-4 text-[10px] text-white bg-black/35 px-2 py-0.5 rounded-full">
          {p.duration}
        </span>
      )}
    </div>
  );
}

/** Reads one publication: headline, byline, cover and body. Desktop puts the
 *  headline above the cover inside a popup; mobile leads with the cover. */
export function PublicationReader({
  p,
  onClose,
}: {
  p: Publication;
  onClose: () => void;
}) {
  const isDesktopWeb = useIsDesktopWeb();
  // The reference's `v3-rule` has no colour outside its V3 build, so in the
  // web design it is a blank 1px gap, not a visible hairline.
  const rule = <div className="h-px" />;

  const head = (
    <>
      <h2 className="v3-display text-[27px] text-[#0A1F4D]">{p.title}</h2>
      <p className="text-[12px] text-slate-400">
        {p.author} · {p.date}
        {p.readTime ? ` · ${p.readTime}` : ""}
        {p.duration ? ` · ${p.duration}` : ""}
      </p>
    </>
  );
  const text = (
    <>
      <p className="text-[14.5px] leading-[1.7] text-[#0A1F4D]">{p.excerpt}</p>
      {p.body?.map((para, i) => (
        <p key={i} className="text-[14.5px] leading-[1.7] text-[#0A1F4D]">
          {para}
        </p>
      ))}
      {!p.body && (
        <p className="text-[13px] leading-relaxed text-slate-400">
          {p.kind === "video"
            ? "Full video plays here."
            : "Swipe through the full set in the app."}
        </p>
      )}
    </>
  );

  return (
    <OverlayRoot
      onClose={onClose}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="absolute inset-0 z-[75] bg-white flex flex-col overflow-hidden"
    >
      <div className="h-[56px] px-5 flex items-center justify-between shrink-0">
        <span className="v3-eyebrow">{p.category}</span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full border border-[rgba(10,31,77,0.10)] flex items-center justify-center text-[#0A1F4D]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-[130px]">
        {isDesktopWeb ? (
          <div className="px-8 pt-7 pb-8 space-y-5">
            {head}
            <Hero
              p={p}
              className="relative h-[300px] rounded-card overflow-hidden flex items-center justify-center"
            />
            {rule}
            {text}
          </div>
        ) : (
          <>
            <Hero
              p={p}
              className="relative h-[240px] flex items-center justify-center"
            />
            <div className="px-6 pt-7 space-y-4 mx-auto w-full max-w-[calc(720px*var(--wx,1))]">
              {head}
              {rule}
              {text}
            </div>
          </>
        )}
      </div>
    </OverlayRoot>
  );
}
