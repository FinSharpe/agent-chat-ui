"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { AnimatedWaveFooter, GrainOverlay } from "./WavePattern";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";

/* Shared layout pieces for the mixed-density language: the app keeps its
   cards and pills, but lists that are really just navigation become cardless
   rows separated by hairlines, and full-bleed banners act as the break
   between one section and the next. */

/** The four abstract wave backgrounds used on SectionBanners, roughly
 *  dark → light. Call sites pick from these so the mix reads as random,
 *  keeping in mind: no page should show the same one on two banners in a
 *  row. */
export const BANNER_WAVE = {
  royal: "/graphics/banner-wave-royal.jpg", // deepest — best white-text contrast
  sky: "/graphics/banner-wave-sky.jpg",     // mid periwinkle
  cyan: "/graphics/banner-wave-cyan.jpg",   // bright cyan
  teal: "/graphics/banner-wave-teal.jpg",   // lightest, white → cyan
} as const;

/** Small uppercase section label, matching the existing Home/Import style. */
export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-xs font-medium text-black uppercase tracking-wider block ${className}`}>
      {children}
    </span>
  );
}

/**
 * Cardless list row — icon tile, title, supporting line, chevron, closed by a
 * hairline. Replaces a stack of glass-cards where the content is a link
 * rather than a piece of data worth framing.
 */
export function ListRow({
  icon, title, sub, trailing, onClick, tone = 0,
}: {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  /** Replaces the chevron — a pill, a value, a sentiment badge. */
  trailing?: React.ReactNode;
  onClick?: () => void;
  tone?: number;
}) {
  const TONES = [
    { bg: "bg-[#063BAA]/8", fg: "text-[#063BAA]" },
    { bg: "bg-[#97edcc]/30", fg: "text-[#0A9E6E]" },
    { bg: "bg-[#0A1F4D]/8", fg: "text-[#0A1F4D]" },
  ];
  const t = TONES[tone % TONES.length];
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <button
      onClick={onClick}
      className={
        isDesktopWeb
          ? "relative w-[calc(100%+1.5rem)] -mx-3 px-3 flex items-center gap-3.5 py-3.5 text-left rounded-tile transition-colors hover:bg-[#063BAA]/[0.04] after:absolute after:left-3 after:right-3 after:bottom-0 after:h-px after:bg-slate-100 dark:after:bg-slate-800/60 last:after:hidden"
          : "w-full flex items-center gap-3.5 py-3.5 text-left border-b border-slate-100 last:border-b-0 active:bg-[#063BAA]/[0.03] transition-colors"
      }

    >
      {icon && (
        <span className={`w-10 h-10 rounded-tile ${t.bg} ${t.fg} flex items-center justify-center shrink-0`}>
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium text-[#0A1F4D] leading-snug">{title}</span>
        {sub && <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{sub}</span>}
      </span>
      {trailing ?? <ArrowRight size={14} className="text-slate-300 shrink-0" />}
    </button>
  );
}

/**
 * Separator banner — same width and card shape as the Features carousel
 * cards on Home (w-full, rounded-card, p-7), just taller, so it reads as
 * a break between sections rather than a full-bleed strip breaking out of
 * the page gutter. Pure message, no CTA — it previews whatever section
 * comes right after it, rather than pitching the one before.
 */
export function SectionBanner({
  eyebrow, title, tone = "blue", image, imageBase = "transparent", imageDark = true, imageScrim = false, height = 340, titleSize,
}: {
  eyebrow?: string;
  title: string;
  tone?: "blue" | "mint" | "navy";
  /** Photo background instead of the flat gradient — text drops to the
      bottom of the card, over a dark scrim, so it reads over any photo. */
  image?: string;
  /** Solid fill behind the artwork — the wave illustrations are partly
      transparent, so without this the gaps show the page white. Defaults to
      a light brand-blue tint; pass a stronger colour for a darker card. */
  imageBase?: string;
  /** Set false when the image's own bottom band is light (a light wave,
      not a dark night scene) — switches the text to brand blue instead of
      white so it still reads. */
  imageDark?: boolean;
  /** Add a bottom-up dark gradient over the photo, behind the text. Use
      when the artwork's own bottom band is too light or too busy for white
      text to read against it unaided (e.g. a pale sky-and-water scene). */
  imageScrim?: boolean;
  /** Card height in px. Default (340) matches the Features carousel cards
   *  on Home; pass a smaller value for a shorter, less dominant banner. */
  height?: number;
  /** Title font size in px. Default is 19 (image banners) or 27 (flat
   *  colour banners) — override for a longer sentence that would otherwise
   *  run to too many lines at the default size. */
  titleSize?: number;
}) {
  const isFilled = tone !== "mint";
  const bg =
    tone === "blue" ? "bg-brand-gradient"
    : tone === "navy" ? "bg-[#0A1F4D]"
    : "bg-hero-mint";
  const imageTextCls = imageDark ? "text-white" : "text-[#063BAA]";

  return (
    <div
      style={{ height, ...(image ? { backgroundColor: imageBase } : {}) }}
      className={`w-full rounded-card p-7 relative overflow-hidden flex flex-col premium-shadow-sm group/media ${
        image ? `justify-end ${imageTextCls}` : `justify-center ${bg} ${isFilled ? "text-white" : "text-[#0A1F4D]"}`
      }`}
    >
      {image && (
        // The wave art is partly transparent — the imageBase fill above shows
        // through its gaps so the card reads as a soft colour, not page white.
        <div className="absolute -inset-px bg-cover bg-center pointer-events-none transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100" style={{ backgroundImage: `url(${image})` }} />
      )}
      {image && imageScrim && (
        <div
          className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(6,17,46,0.82) 0%, rgba(6,17,46,0.44) 42%, transparent 100%)" }}
        />
      )}
      {isFilled && !image && (
        <span className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      )}
      <span className={`relative block z-10 ${image ? "space-y-1.5" : "space-y-3"}`}>
        {eyebrow && (
          <span className={`v3-eyebrow block ${image ? (imageDark ? "!text-white" : "!text-[#063BAA]") : isFilled ? "!text-white" : "!text-[#0A9E6E]"}`}>
            {eyebrow}
          </span>
        )}
        <span
          className={`v3-display block ${image ? "leading-[1.3]" : "leading-[1.15]"}`}
          style={{ fontSize: titleSize ?? (image ? 19 : 27) }}
        >
          {title}
        </span>
      </span>
    </div>
  );
}

/**
 * End-to-end wave footer — the one element on the screen allowed to break out
 * of the page gutter, since it closes the page rather than sitting inside its
 * flow, so the darkest (bottom) layer, the richest colour in it, is actually
 * visible. Animated via AnimatedWaveFooter — the same big, hand-drawn
 * swells used across the reference component, each layer scrolling and
 * bobbing on its own independent cycle. Its own preserveAspectRatio="none"
 * already stretches each layer to fill exactly, so the wave's own aspect
 * ratio below is a free styling choice, not something the artwork
 * constrains. The top-edge mask-image fades it into the page's white
 * background above it; that has to live on the wave itself (not inside the
 * SVG, and not shared with the tagline below) so it stays correct no
 * matter where each layer's loop currently sits, and so an optional
 * tagline never gets faded along with it. Screens should pair this with a
 * small (not large) bottom scroll-padding, since the footer itself — not
 * the old padding — is now what keeps the last real content clear of the
 * nav.
 *
 * `tagline`: a short, small, white line of copy sat low on the wave, over
 * its solid-colour lower band where white text stays legible without
 * needing its own scrim. Optional — most screens don't pass one yet.
 */
export function ScreenFooter({ tagline, wide = false }: { tagline?: string; wide?: boolean }) {
  const fade = "linear-gradient(to bottom, transparent 0%, black 18%, black 100%)";

  // Desktop web: there is no bottom nav and no page gutter to break out of —
  // place it after the page column, full width of the panel, and keep it a
  // low band (the mobile 1000:640 ratio would be ~650px tall on a wide screen).
  if (wide) {
    const wideFade = "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 20%, black 55%, black 100%)";
    return (
      <div className="relative w-full">
        <div
          aria-hidden="true"
          className="relative overflow-hidden pointer-events-none select-none"
          style={{ aspectRatio: "1440 / 320", WebkitMaskImage: wideFade, maskImage: wideFade }}
        >
          {/* Same colours, but diffused (blurred, oversized so the blur never
              shows an edge) and grainy — a soft wash rather than a hard shape. */}
          <div className="absolute -inset-10" style={{ filter: "blur(7px)", transform: "translateZ(0)", willChange: "transform" }}>
            <AnimatedWaveFooter />
          </div>
          <GrainOverlay />
        </div>
        {tagline && (
          <p className="v3-display absolute inset-x-0 bottom-10 px-10 text-center text-[22px] text-white">
            {tagline}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative -mx-5" style={{ width: "calc(100% + 2.5rem)" }}>
      <div
        aria-hidden="true"
        className="pointer-events-none select-none"
        style={{ aspectRatio: "1000 / 640", WebkitMaskImage: fade, maskImage: fade }}
      >
        <AnimatedWaveFooter />
      </div>
      {tagline && (
        // bottom-24 (96px), not a smaller offset: the bottom nav is an
        // absolutely positioned overlay (not part of the scroll flow), so
        // it covers roughly the last ~80px of whatever sits at the very
        // bottom of the scroll area regardless of scroll position — this
        // needs to clear that zone, just not by so much it reads as
        // floating in the middle of the wave. v3-display is the same
        // serif used for headline numbers elsewhere (SectionBanner
        // titles, the Net Worth total) — regular (400) weight, not the
        // Inter body font.
        <p className="v3-display absolute inset-x-0 bottom-24 px-10 text-center text-[17px] text-white">
          {tagline}
        </p>
      )}
    </div>
  );
}
