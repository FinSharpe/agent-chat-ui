"use client";

import { useMemo, useState } from "react";
import { Maximize2, Search, ZoomIn, ZoomOut } from "lucide-react";
import FeatureHeader from "@/components/discover/FeatureHeader";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import {
  NEWS_CLUSTERS,
  NEWS_CROSS_EDGES,
  NEWS_NODES,
  NEWS_TRENDING,
  NewsNode,
} from "../../constants/news-impact-data";
import { NewsImpactGraph } from "./NewsImpactGraph";

type Mode = "within" | "cross";

const headerBtn =
  "w-8 h-8 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover-tint";

// Within-cluster mode links each node to the next one in its ring.
const WITHIN_EDGES: [string, string][] = NEWS_CLUSTERS.flatMap((cl) => {
  const members = NEWS_NODES.filter((n) => n.c === cl.id);
  return members.map(
    (n, i) => [n.id, members[(i + 1) % members.length].id] as [string, string],
  );
});

/** News Impact — a topic graph linking news themes to assets, sectors and stocks. */
export function NewsImpact({ onBack }: { onBack: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("cross");
  const [selected, setSelected] = useState<NewsNode | null>(null);
  const [query, setQuery] = useState("");
  const isDesktopWeb = useIsDesktopWeb();

  const edges = useMemo(
    () => (mode === "cross" ? NEWS_CROSS_EDGES : WITHIN_EDGES),
    [mode],
  );

  const headerRight = (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
        aria-label="Zoom in"
        className={`${headerBtn} text-slate-400`}
      >
        <ZoomIn size={14} />
      </button>
      <button
        onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
        aria-label="Zoom out"
        className={`${headerBtn} text-slate-400`}
      >
        <ZoomOut size={14} />
      </button>
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? "Shrink graph" : "Expand graph"}
        className={`${headerBtn} ${expanded ? "bg-[#063BAA]/8 text-[#063BAA]" : "text-slate-400"}`}
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title="News Impact"
        subtitle="Trending topics & market themes"
        onBack={onBack}
        right={headerRight}
      />

      <div
        className={`scrollbar-none flex-1 space-y-4 overflow-y-auto px-5 py-3 ${isDesktopWeb ? "pb-16" : "pb-[130px]"}`}
      >
        <div className="glass-tile flex items-center gap-2 rounded-full px-3.5 py-2.5">
          <Search
            size={14}
            className="shrink-0 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, sectors, stocks…"
            className="flex-1 border-none bg-transparent text-xs text-[#0A1F4D] placeholder-[#0A1F4D]/50 focus:outline-none dark:text-white"
          />
        </div>

        <div>
          <p className="mb-1.5 px-0.5 text-[9px] font-medium tracking-wider text-slate-400 uppercase">
            Trending
          </p>
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
            {NEWS_TRENDING.map((x) => (
              <div
                key={x.t}
                className="glass-card flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5"
              >
                <span className="text-[10px] font-medium whitespace-nowrap text-[#0A1F4D] dark:text-slate-200">
                  {x.t}
                </span>
                <span
                  className={`text-[10px] font-medium ${x.v.startsWith("-") ? "text-rose-500" : "text-[#0A9E6E]"}`}
                >
                  {x.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="glass-tile flex w-fit items-center justify-center gap-1 rounded-full p-1 select-none">
            {(["within", "cross"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setSelected(null);
                }}
                className={`rounded-full px-4 py-1.5 text-[11px] font-medium capitalize transition-all ${mode === m ? "bg-[#063BAA] text-white shadow-xs" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <NewsImpactGraph
          edges={edges}
          zoom={zoom}
          heightClass={expanded ? "h-[460px]" : "h-[340px]"}
          query={query}
          selected={selected}
          onSelect={setSelected}
        />

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 select-none">
          {NEWS_CLUSTERS.map((cl) => (
            <div
              key={cl.id}
              className="flex items-center gap-1.5"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: cl.color }}
              />
              <span className="text-[10px] font-medium text-slate-500">
                {cl.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
