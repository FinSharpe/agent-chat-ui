"use client";

import { useMemo } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  NEWS_CLUSTERS,
  NEWS_NODES,
  NewsNode,
} from "../../constants/news-impact-data";

const CENTERS = [
  [28, 28],
  [72, 28],
  [28, 72],
  [72, 72],
];

/** Quadrant rings and their labels, one per cluster. */
const QUADRANTS = [
  {
    cx: 28,
    cy: 28,
    labelY: 8.5,
    label: "NEWS & SENTIMENT",
    color: "#063BAA",
    rgb: "6, 59, 170",
  },
  {
    cx: 72,
    cy: 28,
    labelY: 8.5,
    label: "ASSET CLASSES",
    color: "#0A9E6E",
    rgb: "10, 158, 110",
  },
  {
    cx: 28,
    cy: 72,
    labelY: 93.5,
    label: "SECTORS",
    color: "#F59E0B",
    rgb: "245, 158, 11",
  },
  {
    cx: 72,
    cy: 72,
    labelY: 93.5,
    label: "STOCKS",
    color: "#8B5CF6",
    rgb: "139, 92, 246",
  },
];

// Nodes sit organically in rings around their quadrant's centre.
const POSITIONS = (() => {
  const pos: Record<string, { x: number; y: number }> = {};
  NEWS_CLUSTERS.forEach((cl) => {
    const members = NEWS_NODES.filter((n) => n.c === cl.id);
    const [cx, cy] = CENTERS[cl.id];
    members.forEach((n, i) => {
      const ang =
        (i / members.length) * Math.PI * 2 + (i % 2 === 0 ? 0.35 : -0.35);
      const radius = 8 + (i % 4) * 2.8;
      pos[n.id] = {
        x: cx + Math.cos(ang) * radius,
        y: cy + Math.sin(ang) * radius,
      };
    });
  });
  return pos;
})();

export function NewsImpactGraph({
  edges,
  zoom,
  heightClass,
  query,
  selected,
  onSelect,
}: {
  edges: [string, string][];
  zoom: number;
  heightClass: string;
  query: string;
  selected: NewsNode | null;
  onSelect: (n: NewsNode | null) => void;
}) {
  const neighbors = useMemo(() => {
    const s = new Set<string>();
    if (!selected) return s;
    edges.forEach(([a, b]) => {
      if (a === selected.id) s.add(b);
      if (b === selected.id) s.add(a);
    });
    return s;
  }, [selected, edges]);

  const nodeVisible = (n: NewsNode) =>
    !query || n.label.toLowerCase().includes(query.toLowerCase());

  return (
    <div
      className={`glass-card rounded-card relative overflow-hidden transition-all ${heightClass}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(50 50) scale(${zoom}) translate(-50 -50)`}>
          <g opacity={0.85}>
            {QUADRANTS.map((q) => (
              <g key={q.label}>
                <circle
                  cx={q.cx}
                  cy={q.cy}
                  r={23}
                  fill={`rgba(${q.rgb}, 0.01)`}
                  stroke={`rgba(${q.rgb}, 0.06)`}
                  strokeWidth={0.4}
                  strokeDasharray="1.5 1.5"
                />
                <text
                  x={q.cx}
                  y={q.labelY}
                  textAnchor="middle"
                  fontSize={2.2}
                  fill={q.color}
                  fontWeight={500}
                  opacity={0.4}
                  letterSpacing={0.12}
                  className="font-geist select-none"
                >
                  {q.label}
                </text>
              </g>
            ))}
          </g>

          {edges.map(([a, b], i) => {
            const pa = POSITIONS[a];
            const pb = POSITIONS[b];
            if (!pa || !pb) return null;
            const hot = selected && (a === selected.id || b === selected.id);
            const dim = selected && !hot;
            return (
              <line
                key={i}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={hot ? "#063BAA" : "#CBD5E1"}
                strokeWidth={hot ? 0.6 : 0.3}
                strokeDasharray={hot ? "1 1" : undefined}
                opacity={dim ? 0.12 : hot ? 0.95 : 0.45}
              />
            );
          })}

          {NEWS_NODES.map((n) => {
            const p = POSITIONS[n.id];
            const cl = NEWS_CLUSTERS[n.c];
            const isSel = selected?.id === n.id;
            const dim =
              (selected && !isSel && !neighbors.has(n.id)) || !nodeVisible(n);
            const r = n.c === 3 ? 2.5 : 2.9;
            return (
              <g
                key={n.id}
                onClick={() => onSelect(n)}
                style={{ cursor: "pointer" }}
                opacity={dim ? 0.22 : 1}
              >
                {isSel && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r + 1.8}
                    fill="none"
                    stroke={cl.color}
                    strokeWidth={0.5}
                    opacity={0.4}
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSel ? r + 0.6 : r}
                  fill={cl.color}
                  opacity={isSel ? 1 : 0.85}
                  stroke={isSel ? "#fff" : "none"}
                  strokeWidth={0.6}
                />
                {/* A white halo behind the label keeps it legible over edges. */}
                <text
                  x={p.x}
                  y={p.y + r + 2.2}
                  textAnchor="middle"
                  fontSize={1.4}
                  fill="#fff"
                  stroke="#fff"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                  className="select-none"
                >
                  {n.label}
                </text>
                <text
                  x={p.x}
                  y={p.y + r + 2.2}
                  textAnchor="middle"
                  fontSize={1.4}
                  fill="#334155"
                  fontWeight={500}
                  className="select-none dark:fill-slate-300"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {selected && (
        <div className="glass-card rounded-nested animate-fade-in absolute right-3 bottom-3 left-3 flex items-start gap-2.5 p-3 shadow-lg">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]">
            <AlertTriangle size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] leading-none font-medium text-[#0A1F4D] dark:text-white">
                {selected.label}
              </span>
              <span
                className={`text-[10px] font-medium ${selected.change.startsWith("-") ? "text-rose-500" : "text-[#0A9E6E]"}`}
              >
                {selected.change}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              {selected.headline}
            </p>
          </div>
          <button
            onClick={() => onSelect(null)}
            aria-label="Close"
            className="shrink-0 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
