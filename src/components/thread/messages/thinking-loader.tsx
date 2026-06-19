"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "Thinking",
  "Crunching the numbers",
  "Analyzing markets",
  "Generating response",
];

const CYCLE_MS = 2800;
const CROSSFADE_MS = 320;

/* ──────────────────────────────────────────────────────────────────────────
   Neural circuit geometry (viewBox 600). Signals propagate from the centre
   `c` outward along each branch `b.p`; `b.l` marks leaf (terminal) branches.
   ────────────────────────────────────────────────────────────────────────── */
type Branch = { p: number[][]; l: number };
const DATA: { c: number[]; b: Branch[] } = {"c":[301.0,305.9],"b":[{"p":[[332.6,325.7],[339.4,332.6],[374.6,334.3]],"l":0},{"p":[[294.0,384.9],[285.4,393.4],[276.0,396.9],[265.7,406.3],[262.3,425.1],[263.1,440.6],[261.4,445.7],[246.0,464.6],[245.1,490.3],[236.6,501.4],[228.0,506.6]],"l":0},{"p":[[366.0,396.9],[398.6,396.9]],"l":1},{"p":[[212.6,214.3],[219.4,198.9]],"l":0},{"p":[[230.6,198.0],[231.4,178.3],[229.7,172.3],[221.1,162.0],[204.9,149.1],[197.1,134.6]],"l":1},{"p":[[230.6,198.0],[220.3,198.0]],"l":0},{"p":[[256.3,234.9],[245.1,228.9],[236.6,221.1],[232.3,211.7],[232.3,200.6],[230.6,198.0]],"l":0},{"p":[[300.0,510.0],[281.1,526.3],[268.3,530.6],[258.0,530.6],[240.0,523.7],[230.6,514.3],[228.0,507.4]],"l":0},{"p":[[323.1,141.4],[320.6,136.3],[319.7,126.9],[334.3,112.3],[336.0,108.0],[341.1,104.6]],"l":1},{"p":[[300.0,393.4],[300.0,472.3]],"l":0},{"p":[[300.0,472.3],[282.9,480.0],[270.9,481.7]],"l":0},{"p":[[204.9,355.7],[202.3,363.4],[196.3,370.3],[169.7,373.7],[161.1,382.3],[159.4,391.7],[151.7,402.0],[146.6,404.6],[126.9,406.3]],"l":1},{"p":[[421.7,410.6],[435.4,421.7],[456.0,426.9],[465.4,439.7]],"l":0},{"p":[[376.3,334.3],[382.3,329.1],[384.9,324.0]],"l":0},{"p":[[316.3,307.7],[316.3,313.7],[321.4,318.9]],"l":0},{"p":[[332.6,325.7],[339.4,319.7],[350.6,318.9],[354.0,314.6],[358.3,313.7]],"l":0},{"p":[[322.3,319.7],[327.4,324.9],[332.6,325.7]],"l":0},{"p":[[397.7,277.7],[401.1,268.3],[421.7,246.9],[424.3,234.9]],"l":0},{"p":[[364.3,255.4],[373.7,246.9],[375.4,241.7],[378.0,227.1],[375.4,221.1],[375.4,212.6],[378.9,204.0],[387.4,198.0],[397.7,198.9],[407.1,194.6],[411.4,187.7],[413.1,174.0],[427.7,160.3],[431.1,152.6]],"l":0},{"p":[[275.1,261.4],[268.3,256.3],[264.0,243.4],[257.1,235.7]],"l":0},{"p":[[321.4,319.7],[313.7,331.7]],"l":0},{"p":[[284.6,306.9],[283.7,313.7],[279.4,318.9]],"l":0},{"p":[[300.9,304.3],[315.4,306.9]],"l":0},{"p":[[217.7,394.3],[220.3,397.7],[221.1,408.9],[216.9,415.7],[208.3,420.0],[193.7,420.0],[187.7,423.4],[182.6,431.1],[180.0,444.0],[166.3,458.6]],"l":1},{"p":[[245.1,330.9],[239.1,321.4],[231.4,315.4],[229.7,308.6]],"l":0},{"p":[[269.1,325.7],[263.1,331.7],[255.4,333.4],[246.0,331.7]],"l":0},{"p":[[221.1,445.7],[217.7,458.6],[218.6,475.7],[216.9,480.9],[223.7,487.7]],"l":1},{"p":[[173.1,349.7],[170.6,341.1],[159.4,331.7],[154.3,330.9]],"l":0},{"p":[[234.9,303.4],[234.9,289.7],[222.9,280.3],[213.4,279.4]],"l":0},{"p":[[462.9,296.6],[467.1,294.0],[493.7,294.0]],"l":1},{"p":[[446.6,350.6],[466.3,368.6],[496.3,368.6]],"l":1},{"p":[[162.9,147.4],[168.9,126.0],[184.3,109.7],[201.4,102.9],[222.9,105.4]],"l":0},{"p":[[353.1,270.9],[355.7,259.7],[359.1,256.3],[363.4,255.4]],"l":0},{"p":[[96.0,259.7],[79.7,277.7],[75.4,293.1],[77.1,311.1],[86.6,328.3]],"l":0},{"p":[[300.0,210.9],[297.4,195.4]],"l":0},{"p":[[172.3,350.6],[156.0,355.7],[150.9,360.9],[145.7,375.4],[139.7,380.6],[135.4,382.3],[112.3,382.3],[99.4,390.9]],"l":0},{"p":[[221.1,444.9],[216.0,442.3],[207.4,443.1],[201.4,445.7],[194.6,452.6],[190.3,468.0],[186.0,473.1],[184.3,482.6]],"l":0},{"p":[[309.4,280.3],[314.6,269.1]],"l":0},{"p":[[502.3,260.6],[515.1,271.7],[523.7,291.4],[523.7,306.0],[513.4,329.1]],"l":0},{"p":[[385.7,323.1],[390.0,321.4],[417.4,322.3],[425.1,326.6],[438.0,339.4],[459.4,339.4],[463.7,337.7],[480.9,344.6],[492.9,343.7],[513.4,329.1]],"l":0},{"p":[[466.3,439.7],[482.6,436.3],[494.6,427.7],[503.1,411.4],[503.1,392.6],[515.1,382.3],[521.1,372.0],[524.6,358.3],[523.7,346.3],[518.6,334.3],[513.4,329.1]],"l":0},{"p":[[257.1,234.9],[269.1,224.6]],"l":0},{"p":[[214.3,233.1],[206.6,234.9],[180.9,232.3],[171.4,216.9],[163.7,210.9],[150.9,209.1],[144.0,210.9],[126.0,200.6]],"l":0},{"p":[[358.3,170.6],[366.0,163.7],[369.4,156.9],[369.4,118.3],[375.4,106.3]],"l":0},{"p":[[378.0,312.9],[384.9,322.3]],"l":0},{"p":[[269.1,325.7],[263.1,319.7],[253.7,318.0],[240.0,305.1],[235.7,304.3]],"l":0},{"p":[[258.0,193.7],[258.9,174.0],[256.3,160.3],[250.3,152.6],[234.0,144.0],[227.1,137.1],[225.4,133.7],[225.4,111.4],[223.7,106.3]],"l":0},{"p":[[300.9,211.7],[315.4,205.7],[323.1,191.1],[322.3,163.7],[313.7,152.6],[302.6,144.0],[300.9,139.7],[300.9,98.6]],"l":0},{"p":[[222.9,369.4],[220.3,373.7],[217.7,393.4]],"l":0},{"p":[[314.6,269.1],[312.9,267.4],[288.9,267.4],[283.7,269.1],[276.0,263.1]],"l":0},{"p":[[300.9,97.7],[321.4,80.6],[331.7,78.0],[342.9,78.0],[352.3,80.6],[360.9,85.7],[368.6,93.4],[375.4,106.3]],"l":0},{"p":[[278.6,323.1],[275.1,325.7],[269.1,325.7]],"l":0},{"p":[[137.1,440.6],[137.1,458.6],[141.4,468.0],[149.1,476.6],[160.3,482.6],[183.4,483.4]],"l":0},{"p":[[125.1,199.7],[123.4,183.4],[128.6,165.4],[144.0,150.9],[153.4,147.4],[162.0,147.4]],"l":0},{"p":[[228.9,307.7],[216.0,300.0],[181.7,298.3],[150.9,265.7],[132.0,264.9],[128.6,268.3],[113.1,268.3],[97.7,259.7]],"l":0},{"p":[[299.1,304.3],[285.4,306.0]],"l":0},{"p":[[473.1,201.4],[475.7,192.9],[475.7,180.0],[470.6,166.3],[457.7,152.6],[444.0,147.4],[435.4,148.3]],"l":0},{"p":[[360.0,313.7],[368.6,315.4],[377.1,312.9]],"l":0},{"p":[[299.1,372.9],[312.0,372.9]],"l":0},{"p":[[312.9,373.7],[318.9,378.9],[323.1,390.9],[333.4,399.4],[337.7,400.3],[345.4,408.9],[348.0,434.6],[350.6,439.7],[358.3,445.7],[366.0,447.4],[372.9,451.7],[376.3,463.7],[374.6,472.3],[375.4,484.3],[380.6,492.0],[381.4,504.0]],"l":0},{"p":[[473.1,201.4],[483.4,204.0],[488.6,207.4],[497.1,216.0],[504.0,228.9],[505.7,246.0],[502.3,259.7]],"l":0},{"p":[[462.9,297.4],[463.7,304.3],[466.3,307.7],[480.0,318.0]],"l":1},{"p":[[421.7,425.1],[423.4,432.0],[436.3,449.1],[438.0,450.9],[444.9,449.1]],"l":1},{"p":[[381.4,504.9],[386.6,508.3],[394.3,508.3],[408.9,503.1],[415.7,497.1],[423.4,482.6]],"l":0},{"p":[[276.0,261.4],[281.1,256.3],[280.3,239.1],[270.0,224.6]],"l":0},{"p":[[375.4,335.1],[378.0,342.9],[388.3,352.3],[419.1,352.3],[428.6,355.7],[439.7,367.7],[442.3,386.6],[451.7,396.9],[468.9,397.7],[480.9,402.0]],"l":1},{"p":[[279.4,318.9],[269.1,308.6],[260.6,305.1],[252.0,296.6],[252.0,287.1],[250.3,284.6],[251.1,269.1],[247.7,261.4],[228.9,250.3],[215.1,233.1]],"l":0},{"p":[[424.3,233.1],[422.6,218.6],[424.3,205.7],[443.1,186.9],[449.1,178.3]],"l":1},{"p":[[280.3,321.4],[288.0,329.1],[294.9,331.7],[312.9,331.7]],"l":0},{"p":[[299.1,213.4],[286.3,209.1],[275.1,199.7],[258.9,194.6]],"l":0},{"p":[[331.7,267.4],[334.3,252.9],[344.6,242.6],[349.7,241.7],[358.3,234.0],[358.3,229.7],[360.9,227.1],[360.9,196.3],[364.3,190.3],[381.4,179.1],[396.9,163.7],[400.3,156.9],[402.0,131.1]],"l":1},{"p":[[125.1,200.6],[117.4,202.3],[110.6,206.6],[102.0,215.1],[96.9,223.7],[93.4,240.9],[96.9,258.9]],"l":0},{"p":[[300.9,258.9],[299.1,256.3],[300.9,249.4],[300.0,214.3]],"l":0},{"p":[[354.0,271.7],[360.9,270.9],[366.0,266.6]],"l":0},{"p":[[204.0,354.9],[200.6,353.1],[181.7,353.1],[174.0,350.6]],"l":0},{"p":[[276.9,149.1],[278.6,146.6],[278.6,121.7],[265.7,103.7]],"l":1},{"p":[[302.6,480.0],[300.0,492.9],[300.9,509.1]],"l":0},{"p":[[258.9,377.1],[249.4,384.9],[244.3,394.3],[246.0,414.0],[242.6,429.4],[232.3,440.6],[222.0,444.9]],"l":0},{"p":[[330.0,446.6],[327.4,450.0],[327.4,463.7],[324.9,466.3]],"l":1},{"p":[[301.7,510.0],[313.7,522.0],[325.7,528.9],[343.7,530.6],[354.9,528.0],[367.7,521.1],[380.6,504.9]],"l":0},{"p":[[215.1,232.3],[212.6,214.3]],"l":0},{"p":[[211.7,279.4],[189.4,278.6],[180.9,270.0],[166.3,249.4],[153.4,238.3],[124.3,237.4]],"l":0},{"p":[[297.4,193.7],[300.0,190.3],[301.7,173.1]],"l":1},{"p":[[378.0,312.0],[383.1,303.4],[390.9,297.4],[414.0,296.6],[423.4,300.9],[432.9,312.9]],"l":1},{"p":[[434.6,232.3],[440.6,219.4],[449.1,211.7],[461.1,209.1],[473.1,201.4]],"l":0},{"p":[[212.6,214.3],[204.9,212.6],[191.1,196.3],[180.9,193.7],[168.0,193.7],[164.6,191.1]],"l":0},{"p":[[300.9,392.6],[316.3,402.9],[327.4,415.7],[329.1,424.3],[328.3,435.4],[330.9,445.7]],"l":0},{"p":[[294.9,389.1],[286.3,397.7],[275.1,419.1],[275.1,450.0]],"l":1},{"p":[[434.6,147.4],[433.7,134.6],[430.3,126.0],[415.7,109.7],[397.7,102.9],[383.1,103.7],[375.4,106.3]],"l":0},{"p":[[216.9,394.3],[197.1,399.4],[187.7,393.4],[180.0,395.1],[174.0,401.1],[170.6,414.0],[166.3,420.0],[159.4,425.1],[146.6,430.3],[137.1,439.7]],"l":0},{"p":[[397.7,278.6],[399.4,280.3],[435.4,278.6]],"l":0},{"p":[[163.7,191.1],[152.6,181.7]],"l":1},{"p":[[342.0,375.4],[364.3,396.9]],"l":0},{"p":[[276.0,149.1],[269.1,147.4],[252.9,131.1],[248.6,123.4],[244.3,124.3]],"l":1},{"p":[[245.1,331.7],[242.6,333.4],[230.6,333.4],[215.1,350.6],[210.0,351.4],[205.7,354.9]],"l":0},{"p":[[279.4,324.0],[282.9,327.4],[286.3,339.4],[293.1,350.6],[294.0,356.6],[299.1,361.7]],"l":0},{"p":[[219.4,198.0],[215.1,182.6],[208.3,175.7],[203.1,174.0],[180.0,174.0],[170.6,165.4],[165.4,157.7],[162.9,148.3]],"l":0},{"p":[[398.6,434.6],[396.0,440.6],[396.9,469.7]],"l":0},{"p":[[323.1,318.9],[335.1,306.9],[342.0,304.3],[347.1,299.1],[350.6,275.1],[353.1,271.7]],"l":0},{"p":[[300.0,303.4],[301.7,290.6]],"l":1},{"p":[[359.1,312.9],[360.0,306.9],[381.4,282.9],[396.9,278.6]],"l":0},{"p":[[365.1,397.7],[367.7,420.0],[370.3,422.6],[388.3,425.1],[393.4,427.7],[398.6,433.7]],"l":0},{"p":[[318.0,267.4],[318.9,235.7],[326.6,228.0],[338.6,222.9],[344.6,213.4],[343.7,156.9],[345.4,149.1],[343.7,144.9]],"l":1},{"p":[[313.7,332.6],[307.7,348.0],[307.7,353.1],[300.0,361.7]],"l":0},{"p":[[366.9,265.7],[382.3,264.9],[397.7,251.1],[399.4,222.0]],"l":1},{"p":[[316.3,306.0],[324.0,298.3],[332.6,284.6],[333.4,271.7],[331.7,268.3]],"l":0},{"p":[[312.9,372.0],[318.9,366.0],[322.3,354.9],[327.4,350.6],[336.9,348.0],[352.3,348.0],[362.6,351.4],[383.1,371.1],[389.1,372.9],[408.9,372.9],[414.0,375.4],[420.0,384.9],[420.9,409.7]],"l":0},{"p":[[86.6,328.3],[81.4,333.4],[77.1,342.0],[75.4,352.3],[76.3,364.3],[84.9,381.4],[97.7,390.9]],"l":0},{"p":[[153.4,330.0],[151.7,324.9],[145.7,319.7],[122.6,319.7],[113.1,330.0],[107.1,332.6],[99.4,332.6],[94.3,329.1],[86.6,328.3]],"l":0},{"p":[[300.0,97.7],[280.3,81.4],[269.1,78.0],[258.0,78.0],[247.7,80.6],[239.1,85.7],[230.6,94.3],[223.7,105.4]],"l":0},{"p":[[304.3,479.1],[313.7,481.7],[321.4,486.9],[326.6,493.7],[327.4,501.4],[330.9,507.4],[336.9,511.7],[342.9,511.7]],"l":1},{"p":[[294.0,374.6],[280.3,361.7],[278.6,355.7],[274.3,351.4],[264.9,348.0],[249.4,348.0],[240.0,351.4],[223.7,368.6]],"l":0},{"p":[[284.6,306.0],[271.7,292.3],[265.7,281.1],[269.1,269.1],[275.1,263.1]],"l":0},{"p":[[417.4,450.0],[417.4,469.7],[422.6,475.7],[423.4,480.9]],"l":0},{"p":[[465.4,440.6],[463.7,457.7],[456.0,472.3],[448.3,479.1],[437.1,483.4],[424.3,481.7]],"l":0},{"p":[[212.6,278.6],[204.9,268.3],[202.3,259.7],[197.1,259.7]],"l":1},{"p":[[210.9,321.4],[174.9,319.7],[164.6,312.0],[156.0,299.1],[151.7,296.6],[105.4,297.4]],"l":1},{"p":[[270.0,482.6],[268.3,487.7],[268.3,504.9]],"l":1},{"p":[[152.6,331.7],[142.3,338.6],[132.0,350.6],[111.4,354.0],[107.1,356.6]],"l":0},{"p":[[434.6,233.1],[476.6,234.9],[477.4,232.3]],"l":1},{"p":[[184.3,484.3],[189.4,495.4],[200.6,504.9],[211.7,508.3],[227.1,506.6]],"l":0},{"p":[[296.6,194.6],[287.1,190.3],[281.1,182.6],[276.9,150.0]],"l":0},{"p":[[435.4,278.6],[439.7,268.3],[450.0,258.9],[468.0,258.0],[479.1,265.7],[485.1,267.4],[501.4,260.6]],"l":0},{"p":[[331.7,446.6],[337.7,449.1],[350.6,462.0],[353.1,468.9],[353.1,498.9]],"l":1},{"p":[[318.9,268.3],[330.9,268.3]],"l":0},{"p":[[136.3,439.7],[120.9,438.0],[111.4,432.9],[102.0,423.4],[96.9,410.6],[96.0,400.3],[98.6,391.7]],"l":0},{"p":[[435.4,278.6],[452.6,294.0],[462.0,296.6]],"l":0},{"p":[[399.4,434.6],[406.3,436.3],[417.4,450.0]],"l":0}]};

const VB = 600;
const GX1 = 78;
const GX2 = 524;
const C = DATA.c;

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

type Geo = {
  p: number[][];
  cum: number[];
  len: number;
  d0: number;
  leaf: number;
  midX: number;
  endX: number;
};

const BR: Geo[] = DATA.b.map((o) => {
  const p = o.p;
  const cum = [0];
  let L = 0;
  for (let i = 1; i < p.length; i++) {
    L += dist(p[i], p[i - 1]);
    cum.push(L);
  }
  const mid = p[Math.floor(p.length / 2)];
  return {
    p,
    cum,
    len: L,
    d0: dist(p[0], C),
    leaf: o.l,
    midX: mid[0],
    endX: p[p.length - 1][0],
  };
});
const smooth = (e0: number, e1: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function ptAt(b: Geo, s: number): number[] {
  s = Math.max(0, Math.min(b.len, s));
  const cum = b.cum;
  const p = b.p;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const f = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return [
    p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f,
    p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f,
  ];
}

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

const ANIM_CYCLE = 2.6; // seconds for a full propagation sweep
const SIZE = 120; // rendered px (square)

/* FinSharpe star emblem (public/logo.svg), points re-centred about (0,0) from
   the original 0–500 box so it can be scaled/placed at the brain's hub. The
   inner vertices sit at ±G so the two halves are split by a visible seam; bump
   G to widen the gap between the left/right sides. */
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

function NeuralBrain() {
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

    // 4-stop horizontal gradient (left → right across the brain).
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

    // Single resting line colour shared by the veins AND the emblem strokes.
    const restCol = mix(teal, navy, 0.22);

    // The emblem is the brain's core. We keep EVERY vein (all converge on the
    // hub) and lay the opaque emblem on top: the central tangle is hidden, and
    // each vein emerges from beneath an emblem edge — so they read as connected.
    const EMB = 0.5; // logo scale within the 600 viewBox
    const used = BR;
    const usedEnd = used.map((b) => colorAt(b.endX));
    const Rspan = Math.max(...used.map((b) => b.d0 + b.len)) + 6;
    // Outer radius of the emblem (viewBox units) — bounds the wavefront that
    // sweeps through the logo body so it lights up in sync with the veins.
    const Remb =
      Math.max(
        ...[...LOGO.teal, ...LOGO.blue].flat().map((p) => Math.hypot(p[0], p[1])),
      ) * EMB;

    const mapPt = (p: number[], emb: number): number[] => [
      C[0] + p[0] * emb,
      C[1] + p[1] * emb,
    ];

    // Muted brand fills so the emblem reads as the FinSharpe star yet sits
    // calmly amid the veins. Front (blue arrows) are opaque enough to occlude
    // the back (teal wings) edges they overlap.
    const tealFill = mix(teal, navy, 0.32);
    const blueFill = mix(blue, navy, 0.18);

    // Sub-sample one layer's star edges, tagging each sample with its radius
    // from the hub (viewBox units) so a wavefront can sweep outward along the
    // borders — from the emblem's centre toward the veins.
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
    // `vis` fades the body in/out so the emblem is only present with the pulse.
    const fillLayer = (layer: number[][][], fill: number[], vis: number) => {
      if (vis <= 0.01) return;
      layer.forEach((pts) => {
        ctx.beginPath();
        const m0 = mapPt(pts[0], EMB);
        ctx.moveTo(m0[0], m0[1]);
        for (let i = 1; i < pts.length; i++) {
          const m = mapPt(pts[i], EMB);
          ctx.lineTo(m[0], m[1]);
        }
        ctx.closePath();
        ctx.fillStyle = rgba(fill, 0.95 * vis);
        ctx.fill();
        ctx.strokeStyle = rgba(restCol, 0.85 * vis);
        ctx.lineWidth = 2.6;
        ctx.stroke();
      });
    };

    // Clip to a layer's silhouette and send a TRIANGULAR wavefront through it:
    // scaled copies of the layer's own triangles, growing from the hub outward,
    // so the signal flows through the emblem body in the logo's shape (not a
    // circular ring) — tying the logo into the vein animation.
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
    const pulseLayer = (
      layer: number[][][],
      R: number,
      baseCol: number[],
      vis: number,
    ) => {
      if (R < 0 || vis <= 0.01) return;
      const f = Math.max(0, Math.min(1, R / Remb));
      if (f <= 0.02) return;
      const bright = mix(baseCol, WHITE, 0.72);

      ctx.save();
      traceScaled(layer, 1); // clip to the real silhouette
      ctx.clip();

      // a few nested triangle outlines trailing the head (scale f) toward the
      // centre — a stacked-triangle wavefront expanding through the body
      const N = 4;
      for (let k = N - 1; k >= 0; k--) {
        const s = f - k * 0.17;
        if (s <= 0.02) continue;
        const a = (1 - k / N) * vis;
        traceScaled(layer, s);
        ctx.strokeStyle = rgba(bright, a * 0.16);
        ctx.lineWidth = 8;
        ctx.stroke(); // soft glow
        if (k === 0) {
          traceScaled(layer, s);
          ctx.strokeStyle = rgba(bright, 0.6 * vis);
          ctx.lineWidth = 2.4;
          ctx.stroke(); // bright leading edge
        }
      }
      ctx.restore();
    };

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(SIZE * DPR);
    canvas.height = Math.round(SIZE * DPR);
    const S = canvas.width / VB;

    // Pre-render the resting circuit once (crisp + cheap to blit). The emblem
    // is drawn live each frame on TOP of the veins so it always occludes the
    // central tangle and can host its own animated border glow.
    const base = document.createElement("canvas");
    base.width = canvas.width;
    base.height = canvas.height;
    const bx = base.getContext("2d")!;
    bx.scale(S, S);
    bx.lineCap = "round";
    bx.lineJoin = "round";
    used.forEach((b) => {
      bx.beginPath();
      bx.moveTo(b.p[0][0], b.p[0][1]);
      for (let j = 1; j < b.p.length; j++) bx.lineTo(b.p[j][0], b.p[j][1]);
      bx.strokeStyle = rgba(restCol, 0.72);
      bx.lineWidth = 3;
      bx.stroke();
    });

    const TAIL = 52; // comet length (arc-length units)

    // One propagating wavefront at radius R (layered translucent strokes →
    // colored glow that reads on a light background, no additive blending).
    const drawWave = (R: number) => {
      used.forEach((b, i) => {
        const adv = R - b.d0;
        if (adv <= 0 || adv > b.len + TAIL) return;
        const head = Math.min(adv, b.len);
        const a = smooth(0, TAIL, adv) * (1 - smooth(b.len, b.len + TAIL, adv));
        if (a <= 0.02) return;

        const s0 = Math.max(0, head - TAIL);
        const pts: number[][] = [ptAt(b, s0)];
        for (let j = 0; j < b.p.length; j++)
          if (b.cum[j] > s0 && b.cum[j] < head) pts.push(b.p[j]);
        pts.push(ptAt(b, head));

        const trace = (w: number, alpha: number, col: number[]) => {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
          ctx.strokeStyle = rgba(col, alpha);
          ctx.lineWidth = w;
          ctx.stroke();
        };
        trace(13, a * 0.28, usedEnd[i]); // outer glow
        trace(5, a, usedEnd[i]); // bright core

        // luminous tip near the head
        const pen = pts[pts.length - 2] || pts[0];
        const tip = pts[pts.length - 1];
        ctx.beginPath();
        ctx.moveTo(pen[0], pen[1]);
        ctx.lineTo(tip[0], tip[1]);
        ctx.strokeStyle = rgba(mix(usedEnd[i], WHITE, 0.55), a);
        ctx.lineWidth = 3;
        ctx.stroke();

        // terminal-node flash on leaves
        if (b.leaf) {
          const pe = Math.exp(-Math.pow((adv - b.len) / 16, 2));
          if (pe > 0.03) {
            const e = b.p[b.p.length - 1];
            ctx.beginPath();
            ctx.arc(e[0], e[1], 11, 0, 7);
            ctx.fillStyle = rgba(usedEnd[i], pe * 0.22);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(e[0], e[1], 4, 0, 7);
            ctx.fillStyle = rgba(usedEnd[i], Math.min(1, 0.55 + pe));
            ctx.fill();
          }
        }
      });
    };

    // A wavefront sweeping outward along one layer's edges — lit from the hub
    // toward the tips, where the veins pick the signal up. Glow is the vein
    // gradient lightened, never a recolour. `R<0` means "no glow" (rest frame).
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
    // of the layer behind it. The border glow for a layer is drawn before the
    // NEXT fill, so hidden edges never light up either.
    // Pulse/glow activity envelope — ramps up while the wavefront is passing
    // through the emblem and falls back to 0 once it exits into the veins, so
    // the logo doesn't carry a permanent glow. The body itself stays visible.
    const pulseVis = (R: number) =>
      R < 0
        ? 0
        : smooth(0, Remb * 0.3, R) * (1 - smooth(Remb * 0.9, Remb * 1.7, R));

    const drawEmblem = (R: number) => {
      const pv = pulseVis(R);
      fillLayer(LOGO.teal, tealFill, 1); // back: teal wings (always visible)
      pulseLayer(LOGO.teal, R, tealFill, pv); // signal flows through the body
      glowLayer(TEAL_EDGES, R, pv);
      fillLayer(LOGO.blue, blueFill, 1); // front: blue arrows (occludes teal)
      pulseLayer(LOGO.blue, R, blueFill, pv);
      glowLayer(BLUE_EDGES, R, pv);
    };

    // Ping-pong wavefront: centre → end (first half) → centre (second half),
    // looping with no pause.
    const radiusAt = (p: number) =>
      (p < 0.5 ? p / 0.5 : 1 - (p - 0.5) / 0.5) * Rspan;

    let raf = 0;
    const frame = (now: number) => {
      const t = now / 1000;
      const tau = (t % ANIM_CYCLE) / ANIM_CYCLE;
      const breathe = 1 - 0.012 * (0.5 - 0.5 * Math.cos((t / 5) * 2 * Math.PI));

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);

      // breathe about the centre, then work in viewBox space
      ctx.translate(C[0] * S, C[1] * S);
      ctx.scale(breathe, breathe);
      ctx.translate(-C[0] * S, -C[1] * S);
      ctx.scale(S, S);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // single wavefront looping centre → end → centre
      const R = radiusAt(tau);
      drawWave(R);

      // opaque emblem on top (occludes the central tangle); its border glow
      // sweeps outward from the hub as the same wavefront passes through it
      drawEmblem(R);

      raf = requestAnimationFrame(frame);
    };

    if (reduce) {
      // single calm lit frame
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
      ctx.scale(S, S);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      drawWave(radiusAt(0.45));
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
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % MESSAGES.length);
        setLeaving(false);
      }, CROSSFADE_MS);
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-row items-center gap-1 py-1">
      <NeuralBrain />

      {/* Shimmer-sweep cycling label */}
      <span
        key={index}
        className={`loader-label -ml-2 text-sm font-medium tracking-tight ${
          leaving ? "loader-label-exit" : "loader-label-enter"
        }`}
        aria-live="polite"
      >
        {MESSAGES[index]}
      </span>

      <style jsx>{`
        .loader-label {
          background: linear-gradient(
            90deg,
            var(--text-muted) 0%,
            var(--text-muted) 35%,
            var(--primary-main-light) 48%,
            var(--brand-teal) 52%,
            var(--text-muted) 65%,
            var(--text-muted) 100%
          );
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: label-shimmer 2.4s linear infinite;
        }

        .loader-label-enter {
          animation:
            label-shimmer 2.4s linear infinite,
            label-in 0.32s ease-out both;
        }

        .loader-label-exit {
          animation: label-out 0.32s ease-in both;
        }

        @keyframes label-shimmer {
          0% {
            background-position: 130% 0;
          }
          100% {
            background-position: -130% 0;
          }
        }

        @keyframes label-in {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes label-out {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-6px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .loader-label,
          .loader-label-enter,
          .loader-label-exit {
            animation: none;
            color: var(--text-secondary);
            background: none;
            -webkit-background-clip: initial;
            background-clip: initial;
          }
        }
      `}</style>
    </div>
  );
}
