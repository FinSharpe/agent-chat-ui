"use client";

import { useEffect, useRef } from "react";

/**
 * FinSharpe emblem with a triangular "signal" pulse that sweeps outward from
 * the hub through the stacked star layers — the same animation used by the
 * chat thinking-loader, isolated and scaled up for the auth showcase.
 *
 * The logo stays fully present (brand fills); the pulse is a luminous,
 * stacked-triangle wavefront that periodically radiates through it.
 */

interface AnimatedLogoPulseProps {
  size?: number;
  className?: string;
}

// Star polygons in the original 0–500 box (matches public/logo.svg). Scaling a
// vertex about CENTER by a factor s gives the expanding triangular wavefront.
const CENTER = 250;
const TEAL: number[][][] = [
  [
    [246, 120],
    [83, 91],
    [246, 480],
  ],
  [
    [254, 120],
    [417, 91],
    [254, 480],
  ],
];
const BLUE: number[][][] = [
  [
    [246, 20],
    [77, 420],
    [246, 380],
  ],
  [
    [254, 20],
    [423, 420],
    [254, 380],
  ],
];
const RMAX = Math.max(
  ...[...TEAL, ...BLUE]
    .flat()
    .map((p) => Math.hypot(p[0] - CENTER, p[1] - CENTER)),
);

const CYCLE = 2.6; // seconds per outward pulse

const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgba = (c: number[], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const WHITE = [255, 255, 255];

export function AnimatedLogoPulse({
  size = 160,
  className,
}: AnimatedLogoPulseProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const S = canvas.width / 500;

    // Brand gradients (vertical, like logo.svg). Painted under ctx.scale(S,S),
    // so their 0→500 span lines up with the emblem.
    const tealGrad = ctx.createLinearGradient(0, 0, 0, 500);
    tealGrad.addColorStop(0, "#45e3d7");
    tealGrad.addColorStop(1, "#0b8c87");
    const blueGrad = ctx.createLinearGradient(0, 0, 0, 500);
    blueGrad.addColorStop(0, "#00a2ff");
    blueGrad.addColorStop(1, "#00388a");

    const tracePath = (layer: number[][][], s: number) => {
      // One path, multiple subpaths — a per-polygon beginPath() here would
      // discard earlier subpaths, leaving only the last wing/arrow to fill.
      ctx.beginPath();
      layer.forEach((pts) => {
        ctx.moveTo(
          CENTER + (pts[0][0] - CENTER) * s,
          CENTER + (pts[0][1] - CENTER) * s,
        );
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(
            CENTER + (pts[i][0] - CENTER) * s,
            CENTER + (pts[i][1] - CENTER) * s,
          );
        }
        ctx.closePath();
      });
    };

    const fillLayer = (
      layer: number[][][],
      grad: CanvasGradient | string,
    ) => {
      tracePath(layer, 1);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    // Stacked-triangle wavefront: nested scaled copies trailing the head
    // (scale f) back toward the centre, clipped to the layer silhouette.
    const pulseLayer = (
      layer: number[][][],
      R: number,
      baseCol: number[],
    ) => {
      const f = Math.max(0, Math.min(1, R / RMAX));
      if (f <= 0.02) return;
      const bright = mix(baseCol, WHITE, 0.7);

      ctx.save();
      tracePath(layer, 1);
      ctx.clip();

      const N = 5;
      for (let k = N - 1; k >= 0; k--) {
        const s = f - k * 0.16;
        if (s <= 0.02) continue;
        const a = 1 - k / N;
        tracePath(layer, s);
        ctx.strokeStyle = rgba(bright, a * 0.18);
        ctx.lineWidth = 11;
        ctx.stroke(); // soft glow
        if (k === 0) {
          tracePath(layer, s);
          ctx.strokeStyle = rgba(bright, 0.8);
          ctx.lineWidth = 3;
          ctx.stroke(); // bright leading edge
        }
      }
      ctx.restore();
    };

    const draw = (R: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(S, S);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      fillLayer(TEAL, tealGrad); // back: teal wings
      pulseLayer(TEAL, R, [11, 140, 135]);
      fillLayer(BLUE, blueGrad); // front: blue arrows (occludes teal)
      pulseLayer(BLUE, R, [0, 130, 230]);
    };

    if (reduce) {
      draw(-1); // static brand emblem, no pulse
      return;
    }

    let raf = 0;
    const frame = (now: number) => {
      const p = ((now / 1000) % CYCLE) / CYCLE; // 0 → 1 looping
      draw(p * RMAX * 1.5); // sweep out past the tips, then restart
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, overflow: "visible" }}
    />
  );
}
