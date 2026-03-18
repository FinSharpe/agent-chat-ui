"use client";

import { useId } from "react";
import { motion } from "framer-motion";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

export function AnimatedLogo({ size = 140, className }: AnimatedLogoProps) {
  const uid = useId().replace(/:/g, "");
  const blueId = `blue-${uid}`;
  const tealId = `teal-${uid}`;
  const strokeId = `stroke-${uid}`;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Glow pulse behind logo */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: "-30%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(66, 212, 163, 0.15), rgba(37, 99, 235, 0.05) 50%, transparent 70%)",
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.8,
        }}
      />

      {/* Floating wrapper */}
      <motion.div
        style={{ width: "100%", height: "100%" }}
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 500 500"
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient
              id={blueId}
              x1="0"
              y1="0"
              x2="0"
              y2="500"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#00a2ff" />
              <stop offset="100%" stopColor="#00388a" />
            </linearGradient>
            <linearGradient
              id={tealId}
              x1="0"
              y1="0"
              x2="0"
              y2="500"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#0b8c87" />
              <stop offset="100%" stopColor="#45e3d7" />
            </linearGradient>
            <linearGradient
              id={strokeId}
              x1="0"
              y1="0"
              x2="0"
              y2="500"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
            </linearGradient>
          </defs>

          <g
            stroke={`url(#${strokeId})`}
            strokeWidth={4}
            strokeLinejoin="miter"
            strokeMiterlimit={20}
          >
            {/* Teal left wing — slides from left */}
            <motion.g
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <polygon
                points="246,120 83,91 246,480"
                fill={`url(#${tealId})`}
              />
            </motion.g>

            {/* Teal right wing — slides from right */}
            <motion.g
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <polygon
                points="254,120 417,91 254,480"
                fill={`url(#${tealId})`}
              />
            </motion.g>

            {/* Blue left arrow — slides from top-left */}
            <motion.g
              initial={{ opacity: 0, x: -40, y: -50 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <polygon
                points="246,20 77,420 246,380"
                fill={`url(#${blueId})`}
              />
            </motion.g>

            {/* Blue right arrow — slides from top-right */}
            <motion.g
              initial={{ opacity: 0, x: 40, y: -50 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <polygon
                points="254,20 423,420 254,380"
                fill={`url(#${blueId})`}
              />
            </motion.g>
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
