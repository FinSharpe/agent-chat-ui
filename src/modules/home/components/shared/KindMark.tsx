import type { Publication } from "../../types/home.types";

/** Format cue on a publication cover: a play button for video, frame dots
 *  (the way a carousel post shows its length) for posts, nothing for articles. */
export function KindMark({ p }: { p: Publication }) {
  if (p.kind === "video") {
    return (
      <span className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
        <span
          className="material-symbols-rounded v3-icon text-[#063BAA]"
          style={{ fontSize: 22, fontVariationSettings: '"FILL" 1, "wght" 300' }}
        >
          play_arrow
        </span>
      </span>
    );
  }
  if (p.kind === "post") {
    return (
      <span className="flex items-center gap-1.5">
        {Array.from({ length: p.frames ?? 3 }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/45"}`}
          />
        ))}
      </span>
    );
  }
  return null;
}
