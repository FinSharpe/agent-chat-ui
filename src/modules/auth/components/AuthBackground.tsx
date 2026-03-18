"use client";

import { motion } from "framer-motion";

const orbs = [
  {
    color: "rgba(37, 99, 235, 0.15)",
    size: 600,
    left: "-5%",
    top: "-15%",
    dx: 100,
    dy: 80,
    duration: 20,
  },
  {
    color: "rgba(66, 212, 163, 0.10)",
    size: 500,
    left: "60%",
    top: "50%",
    dx: -80,
    dy: 60,
    duration: 25,
  },
  {
    color: "rgba(0, 56, 138, 0.18)",
    size: 700,
    left: "25%",
    top: "65%",
    dx: 60,
    dy: -50,
    duration: 30,
  },
  {
    color: "rgba(11, 140, 135, 0.08)",
    size: 450,
    left: "75%",
    top: "-5%",
    dx: -60,
    dy: 70,
    duration: 22,
  },
];

const particles = [
  { size: 3, x: "12%", y: "18%", dy: -25, duration: 18, delay: 0, diamond: true },
  { size: 2, x: "45%", y: "72%", dy: -20, duration: 22, delay: 2, diamond: false },
  { size: 4, x: "78%", y: "35%", dy: -30, duration: 16, delay: 4, diamond: true },
  { size: 2, x: "28%", y: "88%", dy: -15, duration: 20, delay: 1, diamond: false },
  { size: 3, x: "65%", y: "12%", dy: -20, duration: 19, delay: 3, diamond: true },
  { size: 2, x: "92%", y: "55%", dy: -25, duration: 21, delay: 5, diamond: false },
  { size: 4, x: "8%", y: "48%", dy: -20, duration: 17, delay: 2, diamond: false },
  { size: 3, x: "55%", y: "92%", dy: -30, duration: 23, delay: 1, diamond: true },
];

export function AuthBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#040b1a" }}
    >
      {/* Base radial gradients for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 0, 79, 0.4), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(11, 140, 135, 0.06), transparent)
          `,
        }}
      />

      {/* Animated gradient orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.left,
            top: orb.top,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: "blur(80px)",
            willChange: "transform",
          }}
          animate={{
            x: [0, orb.dx, 0],
            y: [0, orb.dy, 0],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating particles */}
      {particles.map((p, i) => (
        <motion.div
          key={`particle-${i}`}
          className={`absolute pointer-events-none ${p.diamond ? "rotate-45 bg-white/[0.06]" : "rounded-full bg-white/[0.06]"}`}
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
          }}
          animate={{
            y: [0, p.dy, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(4, 11, 26, 0.6))",
        }}
      />
    </div>
  );
}
