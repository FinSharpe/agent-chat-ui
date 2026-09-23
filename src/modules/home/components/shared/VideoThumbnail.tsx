"use client";

import { useState } from "react";
import { videoFallbackThumbnail, videoThumbnail } from "../../constants/learn";

/**
 * A YouTube thumbnail that fills its (16:9, relatively positioned) frame.
 *
 * `maxresdefault` is already 16:9 but not every upload has one; `hqdefault`
 * exists for every video, and its letterbox bars are cropped by the 16:9
 * frame. A missing maxres can arrive as YouTube's 120×90 grey placeholder
 * rather than an error, so that counts as missing too. If both fail, the
 * navy fill behind stays.
 */
export function VideoThumbnail({
  id,
  eager = false,
}: {
  id: string;
  eager?: boolean;
}) {
  const [stage, setStage] = useState<"max" | "hq" | "none">("max");
  if (stage === "none") return null;

  return (
    <img
      src={stage === "max" ? videoThumbnail(id) : videoFallbackThumbnail(id)}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setStage(stage === "max" ? "hq" : "none")}
      onLoad={(e) => {
        if (stage === "max" && e.currentTarget.naturalWidth <= 120) {
          setStage("hq");
        }
      }}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
    />
  );
}
