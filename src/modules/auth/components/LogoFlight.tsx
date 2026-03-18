"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FLIGHT_DURATION = 2.5;

/* ── Chart-line SVG trails (viewBox 0-100, stretched to screen) ── */
const trails = [
  {
    d: "M -5,72 L 8,62 L 14,67 L 22,48 L 30,53 L 38,38 L 46,42 L 50,50",
    color: "rgba(69, 227, 215, 0.4)",
    glow: "rgba(69, 227, 215, 0.12)",
  },
  {
    d: "M 105,28 L 92,38 L 86,33 L 78,52 L 70,47 L 62,62 L 54,58 L 50,50",
    color: "rgba(69, 227, 215, 0.4)",
    glow: "rgba(69, 227, 215, 0.12)",
  },
  {
    d: "M -5,35 L 8,22 L 15,42 L 22,18 L 30,38 L 38,28 L 46,35 L 50,50",
    color: "rgba(0, 162, 255, 0.4)",
    glow: "rgba(0, 162, 255, 0.12)",
  },
  {
    d: "M 105,65 L 92,78 L 85,58 L 78,82 L 70,62 L 62,72 L 54,65 L 50,50",
    color: "rgba(0, 162, 255, 0.4)",
    glow: "rgba(0, 162, 255, 0.12)",
  },
];

/* ── Flying polygon shapes (waypoints match SVG path vertices) ── */
const flights = [
  {
    // Teal 1: left → center, uptrend
    x: ["-5%", "8%", "14%", "22%", "30%", "38%", "46%", "50%"],
    y: ["72%", "62%", "67%", "48%", "53%", "38%", "42%", "50%"],
    rotate: [90, 65, 50, 35, 20, 10, 3, 0],
    from: "#0b8c87",
    to: "#45e3d7",
    glow: "rgba(69, 227, 215, 0.5)",
  },
  {
    // Teal 2: right → center, downtrend
    x: ["105%", "92%", "86%", "78%", "70%", "62%", "54%", "50%"],
    y: ["28%", "38%", "33%", "52%", "47%", "62%", "58%", "50%"],
    rotate: [-90, -65, -50, -35, -20, -10, -3, 0],
    from: "#0b8c87",
    to: "#45e3d7",
    glow: "rgba(69, 227, 215, 0.5)",
  },
  {
    // Blue 1: left → center, volatile
    x: ["-5%", "8%", "15%", "22%", "30%", "38%", "46%", "50%"],
    y: ["35%", "22%", "42%", "18%", "38%", "28%", "35%", "50%"],
    rotate: [90, 65, 50, 35, 20, 10, 3, 0],
    from: "#00a2ff",
    to: "#00388a",
    glow: "rgba(0, 162, 255, 0.5)",
  },
  {
    // Blue 2: right → center, volatile
    x: ["105%", "92%", "85%", "78%", "70%", "62%", "54%", "50%"],
    y: ["65%", "78%", "58%", "82%", "62%", "72%", "65%", "50%"],
    rotate: [-90, -65, -50, -35, -20, -10, -3, 0],
    from: "#00a2ff",
    to: "#00388a",
    glow: "rgba(0, 162, 255, 0.5)",
  },
];

export function LogoFlight() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(
      () => setVisible(false),
      (FLIGHT_DURATION + 0.5) * 1000,
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-30 pointer-events-none"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* ── Chart-line trails ── */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
          >
            {trails.map((trail, i) => (
              <g key={i}>
                {/* Glow layer */}
                <motion.path
                  d={trail.d}
                  stroke={trail.glow}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: [0, 0.6, 0.6, 0],
                  }}
                  transition={{
                    pathLength: {
                      duration: FLIGHT_DURATION,
                      ease: "easeInOut",
                    },
                    opacity: {
                      duration: FLIGHT_DURATION + 0.4,
                      times: [0, 0.05, 0.75, 1],
                    },
                  }}
                />
                {/* Crisp line */}
                <motion.path
                  d={trail.d}
                  stroke={trail.color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    pathLength: {
                      duration: FLIGHT_DURATION,
                      ease: "easeInOut",
                    },
                    opacity: {
                      duration: FLIGHT_DURATION + 0.4,
                      times: [0, 0.05, 0.75, 1],
                    },
                  }}
                />
              </g>
            ))}
          </svg>

          {/* ── Flying polygon tips ── */}
          {flights.map((f, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: 12,
                height: 16,
                marginLeft: -6,
                marginTop: -8,
              }}
              animate={{
                left: f.x,
                top: f.y,
                rotate: f.rotate,
                opacity: [0, 1, 1, 1, 1, 1, 1, 0],
              }}
              transition={{
                duration: FLIGHT_DURATION,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {/* Glow aura */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: -14,
                  background: `radial-gradient(circle, ${f.glow}, transparent 70%)`,
                }}
              />
              {/* Triangle shard */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(180deg, ${f.from}, ${f.to})`,
                  clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                }}
              />
            </motion.div>
          ))}

          {/* ── Convergence flash ── */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 240,
              height: 240,
              background:
                "radial-gradient(circle, rgba(69, 227, 215, 0.25), rgba(0, 162, 255, 0.1) 40%, transparent 70%)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0, 0.9, 0],
              scale: [0, 0, 1.2, 2],
            }}
            transition={{
              duration: FLIGHT_DURATION + 0.4,
              times: [0, 0.82, 0.92, 1],
              ease: "easeOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
