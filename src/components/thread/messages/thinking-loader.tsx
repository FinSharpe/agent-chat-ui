"use client";

import { useEffect, useRef } from "react";

const VB = 600;
const GX1 = 78;
const GX2 = 524;

/* Emblem hub — the point the FinSharpe star is drawn about, in viewBox-600
   space (formerly the neural circuit's central hub). */
const C = [301.0, 305.9];

const hexToRgb = (h: string): number[] => {
  let s = h.replace("#", "").trim();
  if (s.length === 3)
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
};
const mix = (a: number[], b: number[], t: number): number[] =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));

const LOGO_CYCLE = 2.6; // seconds per emblem pulse (matches login logo)
const SIZE = 52; // rendered px (square)

/* FinSharpe star emblem (public/logo.svg), points re-centred about (0,0) from
   the original 0–500 box so it can be scaled/placed at the hub. The inner
   vertices sit at ±G so the two halves are split by a visible seam; bump G to
   widen the gap between the left/right sides. */
const G = 8; // half-gap between the two halves (centred units; brand was 4)
const LOGO = {
  teal: [
    [
      [-G, -130],
      [-167, -159],
      [-G, 230],
    ],
    [
      [G, -130],
      [167, -159],
      [G, 230],
    ],
  ],
  blue: [
    [
      [-G, -230],
      [-173, 170],
      [-G, 130],
    ],
    [
      [G, -230],
      [173, 170],
      [G, 130],
    ],
  ],
};

function LogoEmblem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Resolve brand palette from CSS custom properties at runtime.
    const css = getComputedStyle(document.documentElement);
    const read = (v: string, fb: string) =>
      css.getPropertyValue(v).trim() || fb;
    const teal = hexToRgb(read("--brand-teal", "#42d4a3"));
    const blue = hexToRgb(read("--primary-main-light", "#063baa"));
    const navy = hexToRgb(read("--primary-main-dark", "#00004f"));
    const WHITE = [255, 255, 255];

    // 4-stop horizontal gradient (left → right across the emblem), used to tint
    // the edge glow so it picks up the brand sweep.
    const COLS = [teal, mix(teal, blue, 0.5), blue, navy];
    const STOPS = [0, 0.32, 0.6, 1];
    const colorAt = (x: number): number[] => {
      let t = (x - GX1) / (GX2 - GX1);
      t = Math.max(0, Math.min(1, t));
      let i = 0;
      while (i < STOPS.length - 1 && t > STOPS[i + 1]) i++;
      const a = COLS[i];
      const b = COLS[Math.min(i + 1, 3)];
      const f = (t - STOPS[i]) / (STOPS[Math.min(i + 1, 3)] - STOPS[i] || 1);
      return a.map((v, k) => v + (b[k] - v) * f);
    };
    const rgba = (c: number[], a: number) =>
      `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

    const EMB = 0.75; // logo scale within the 600 viewBox
    // Outer radius of the emblem (viewBox units) — bounds the wavefront that
    // sweeps through the logo body as it pulses.
    const Remb =
      Math.max(
        ...[...LOGO.teal, ...LOGO.blue].flat().map((p) => Math.hypot(p[0], p[1])),
      ) * EMB;

    const mapPt = (p: number[], emb: number): number[] => [
      C[0] + p[0] * emb,
      C[1] + p[1] * emb,
    ];

    // Vivid brand emblem — identical treatment to the auth login logo
    // (AnimatedLogoPulse): full-saturation vertical gradients with a luminous,
    // stacked-triangle pulse that sweeps outward through the star. The 0–500
    // logo span maps to ±250 centred units, scaled by EMB about the hub C.
    const tealGrad = ctx.createLinearGradient(
      0,
      C[1] - 250 * EMB,
      0,
      C[1] + 250 * EMB,
    );
    tealGrad.addColorStop(0, "#45e3d7");
    tealGrad.addColorStop(1, "#0b8c87");
    const blueGrad = ctx.createLinearGradient(
      0,
      C[1] - 250 * EMB,
      0,
      C[1] + 250 * EMB,
    );
    blueGrad.addColorStop(0, "#00a2ff");
    blueGrad.addColorStop(1, "#00388a");
    const tealPulseCol = [11, 140, 135];
    const bluePulseCol = [0, 130, 230];

    // Sub-sample one layer's star edges, tagging each sample with its radius
    // from the hub (viewBox units) so a wavefront can sweep outward along the
    // borders — from the emblem's centre toward the tips.
    const edgesOf = (layer: number[][][]): number[][][] =>
      layer.map((pts) => {
        const ring = [...pts, pts[0]];
        const out: number[][] = [];
        for (let i = 1; i < ring.length; i++) {
          const a = ring[i - 1];
          const b = ring[i];
          const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const n = Math.max(2, Math.round(seg / 12));
          for (let k = 0; k <= n; k++) {
            const f = k / n;
            const x = a[0] + (b[0] - a[0]) * f;
            const y = a[1] + (b[1] - a[1]) * f;
            out.push([x, y, Math.hypot(x, y) * EMB]);
          }
        }
        return out;
      });
    const TEAL_EDGES = edgesOf(LOGO.teal);
    const BLUE_EDGES = edgesOf(LOGO.blue);

    // Fill + stroke a single layer's triangles (closed). Filling matters: the
    // front layer's fill is what hides the back layer's overlapped borders.
    const fillLayer = (layer: number[][][], grad: CanvasGradient) => {
      // One path with both wings as subpaths, filled once (matches login logo).
      ctx.beginPath();
      layer.forEach((pts) => {
        const m0 = mapPt(pts[0], EMB);
        ctx.moveTo(m0[0], m0[1]);
        for (let i = 1; i < pts.length; i++) {
          const m = mapPt(pts[i], EMB);
          ctx.lineTo(m[0], m[1]);
        }
        ctx.closePath();
      });
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    // Clip to a layer's silhouette and send a TRIANGULAR wavefront through it:
    // scaled copies of the layer's own triangles, growing from the hub outward,
    // so the signal flows through the emblem body in the logo's shape.
    const traceScaled = (layer: number[][][], s: number) => {
      layer.forEach((pts) => {
        ctx.beginPath();
        const m0 = mapPt(pts[0], EMB * s);
        ctx.moveTo(m0[0], m0[1]);
        for (let i = 1; i < pts.length; i++) {
          const m = mapPt(pts[i], EMB * s);
          ctx.lineTo(m[0], m[1]);
        }
        ctx.closePath();
      });
    };
    const pulseLayer = (layer: number[][][], R: number, baseCol: number[]) => {
      const f = Math.max(0, Math.min(1, R / Remb));
      if (f <= 0.02) return;
      const bright = mix(baseCol, WHITE, 0.7);

      ctx.save();
      traceScaled(layer, 1); // clip to the real silhouette
      ctx.clip();

      // nested triangle outlines trailing the head (scale f) back toward the
      // centre — a stacked-triangle wavefront expanding through the body
      const N = 5;
      for (let k = N - 1; k >= 0; k--) {
        const s = f - k * 0.16;
        if (s <= 0.02) continue;
        const a = 1 - k / N;
        traceScaled(layer, s);
        ctx.strokeStyle = rgba(bright, a * 0.18);
        ctx.lineWidth = 11;
        ctx.stroke(); // soft glow
        if (k === 0) {
          traceScaled(layer, s);
          ctx.strokeStyle = rgba(bright, 0.8);
          ctx.lineWidth = 3;
          ctx.stroke(); // bright leading edge
        }
      }
      ctx.restore();
    };

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(SIZE * DPR);
    canvas.height = Math.round(SIZE * DPR);
    const S = canvas.width / VB;

    // A wavefront sweeping outward along one layer's edges — lit from the hub
    // toward the tips. Glow is the brand gradient lightened, never a recolour.
    // `R<0` means "no glow" (rest frame).
    const LOGO_TAIL = 42;
    const glowLayer = (edges: number[][][], R: number, vis: number) => {
      if (R < 0 || vis <= 0.01) return;
      edges.forEach((samples) => {
        for (let i = 1; i < samples.length; i++) {
          const a = samples[i - 1];
          const b = samples[i];
          const adv = R - (a[2] + b[2]) / 2;
          if (adv < 0 || adv > LOGO_TAIL) continue;
          let al = 1 - adv / LOGO_TAIL;
          al *= al * vis; // bright head, soft trailing fade, gated by visibility
          if (al <= 0.02) continue;
          const ma = mapPt(a, EMB);
          const mb = mapPt(b, EMB);
          const col = colorAt((ma[0] + mb[0]) / 2);
          ctx.beginPath();
          ctx.moveTo(ma[0], ma[1]);
          ctx.lineTo(mb[0], mb[1]);
          ctx.strokeStyle = rgba(col, al * 0.3);
          ctx.lineWidth = 7;
          ctx.stroke(); // soft outer glow
          ctx.beginPath();
          ctx.moveTo(ma[0], ma[1]);
          ctx.lineTo(mb[0], mb[1]);
          ctx.strokeStyle = rgba(mix(col, WHITE, 0.55), al);
          ctx.lineWidth = 2.6;
          ctx.stroke(); // bright core
        }
      });
    };

    // Render the emblem back-to-front so each layer's fill occludes the edges
    // of the layer behind it. Treatment matches the auth login logo: vivid
    // brand fills always present, with a luminous stacked-triangle pulse plus
    // an outward edge glow.
    const drawEmblem = (R: number) => {
      fillLayer(LOGO.teal, tealGrad); // back: teal wings (always visible)
      pulseLayer(LOGO.teal, R, tealPulseCol); // pulse sweeps through the body
      glowLayer(TEAL_EDGES, R, 1);
      fillLayer(LOGO.blue, blueGrad); // front: blue arrows (occludes teal)
      pulseLayer(LOGO.blue, R, bluePulseCol);
      glowLayer(BLUE_EDGES, R, 1);
    };

    let raf = 0;
    const frame = (now: number) => {
      const t = now / 1000;
      const breathe = 1 - 0.012 * (0.5 - 0.5 * Math.cos((t / 5) * 2 * Math.PI));

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // breathe about the centre, then work in viewBox space
      ctx.translate(C[0] * S, C[1] * S);
      ctx.scale(breathe, breathe);
      ctx.translate(-C[0] * S, -C[1] * S);
      ctx.scale(S, S);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // emblem pulse on the login logo's own outward cycle — vivid fills with a
      // stacked-triangle wavefront radiating from the hub, looping every
      // LOGO_CYCLE.
      const pEmb = (t % LOGO_CYCLE) / LOGO_CYCLE;
      drawEmblem(pEmb * Remb * 1.5);

      raf = requestAnimationFrame(frame);
    };

    if (reduce) {
      // single calm resting frame
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(S, S);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      drawEmblem(-1); // emblem at rest, no border glow
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block shrink-0"
      style={{ width: SIZE, height: SIZE }}
    />
  );
}

export function ThinkingLoader() {
  return (
    <div className="flex flex-row items-center py-1">
      <LogoEmblem />
    </div>
  );
}
