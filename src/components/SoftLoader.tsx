"use client";

import React from "react";
import { motion } from "framer-motion";
import InteractiveWave from "@/components/InteractiveWave";

interface LoaderProps {
  variant?: "full" | "inline" | "card" | "chart" | "chat" | "sync" | "wave";
  message?: string;
  /** 0–100. Shown under the message when the caller tracks real progress. */
  progress?: number;
}

export default function SoftLoader({ variant = "inline", message, progress }: LoaderProps) {
  const gradientStyle = {
    background: "linear-gradient(30deg, #063BAA 0%, #96E7CD 100%)",
  };

  // 0. WAVE LOADER — the brand wave in motion, for any wait that would
  // otherwise leave the user staring at a static screen (OTP send, account
  // verification, first mount). Motion is the point: it signals "working".
  if (variant === "wave") {
    return (
      <div className="relative flex-1 w-full flex flex-col items-center justify-center overflow-hidden select-none font-funnel">
        <div className="absolute inset-0 pointer-events-none">
          <InteractiveWave
            variant="color"
            baseAmplitude={120}
            waveCount={7}
            baseSpeed={0.02}
            baseFrequency={0.0009}
            className="w-[140%] h-[140%] -left-[20%] -top-[20%] rotate-[-6deg]"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-3">
          {message && (
            <motion.span
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm font-medium font-geist text-[#0A1F4D] uppercase tracking-wider text-center"
            >
              {message}
            </motion.span>
          )}
          {progress != null && (
            <span className="text-5xl font-geist font-medium text-[#063BAA] tabular-nums">
              {progress}%
            </span>
          )}
        </div>
      </div>
    );
  }

  // 1. FULL SCREEN LOADER
  if (variant === "full") {
    return (
      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50 p-6 font-funnel select-none">
        <div className="relative w-16 h-16 mb-4">
          {/* Animated concentric gradient rings */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-35"
            style={gradientStyle}
            animate={{ scale: [1, 1.15, 1], rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full opacity-60"
            style={gradientStyle}
            animate={{ scale: [1, 0.9, 1], rotate: -360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-white flex items-center justify-center shadow-md shadow-blue-900/5"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#063BAA]" />
          </motion.div>
        </div>
        {message && (
          <motion.p
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs font-medium text-[#0A1F4D] tracking-wide uppercase text-center"
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }

  // 2. CARD LOADER
  if (variant === "card") {
    return (
      <div className="w-full min-h-[140px] bg-white border border-slate-100/80 rounded-card p-5 flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Subtle shimmer effect */}
        <motion.div
          className="absolute inset-0 w-[200%] h-full opacity-5"
          style={{
            background: "linear-gradient(90deg, transparent 0%, #063BAA 50%, transparent 100%)"
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative w-8 h-8 mb-3">
          <motion.div
            className="w-full h-full rounded-full border-2 border-slate-100 border-t-[#063BAA]"
            style={{ borderTopColor: "#063BAA" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        {message ? (
          <span className="text-[11px] font-medium text-[#0A1F4D] font-funnel">{message}</span>
        ) : (
          <span className="text-[11px] font-medium text-[#0A1F4D] font-funnel">Loading insights...</span>
        )}
      </div>
    );
  }

  // 3. CHART LOADER
  if (variant === "chart") {
    return (
      <div className="w-full h-48 bg-white border border-slate-100/80 rounded-card p-5 flex flex-col items-center justify-center relative overflow-hidden select-none">
        <div className="absolute inset-x-5 bottom-6 top-10 flex items-end justify-between gap-2.5">
          {[40, 75, 55, 90, 60, 80, 50, 70].map((height, i) => (
            <motion.div
              key={i}
              className="w-full rounded-t-md opacity-10"
              style={{
                height: `${height}%`,
                background: "linear-gradient(180deg, #063BAA 0%, #96E7CD 100%)"
              }}
              animate={{ opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center bg-white py-2.5 px-4 rounded-full border border-slate-100 shadow-xs">
          <motion.div
            className="w-4 h-4 rounded-full border-2 border-slate-100 border-t-[#063BAA] mb-1.5"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-[10px] font-medium text-[#0A1F4D] uppercase tracking-wider font-funnel">
            {message || "Preparing Chart Analysis"}
          </span>
        </div>
      </div>
    );
  }

  // 4. CHAT LOADER (STREAMING/ANALYZING)
  if (variant === "chat") {
    return (
      <div className="flex flex-col gap-2 py-3 font-funnel max-w-[85%] select-none">
        <div className="flex items-center gap-1.5 px-3">
          <div className="relative w-4 h-4">
            <motion.div
              className="absolute inset-0 rounded-full opacity-60"
              style={gradientStyle}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#063BAA]" />
            </div>
          </div>
          <span className="text-[10px] font-medium text-[#0A1F4D] uppercase tracking-wider">
            FinSharpeGPT is analyzing...
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-card rounded-tl-xs p-4 shadow-xs">
          <div className="space-y-2">
            <div className="h-3.5 bg-slate-100 rounded-md w-11/12 animate-pulse" />
            <div className="h-3.5 bg-slate-100 rounded-md w-5/6 animate-pulse" />
            <div className="h-3.5 bg-slate-100 rounded-md w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 5. SYNC LOADER
  if (variant === "sync") {
    return (
      <div className="p-4 bg-[#063BAA]/8 border border-[#063BAA]/12 rounded-card flex items-center gap-3.5 font-funnel select-none">
        <div className="relative w-10 h-10 shrink-0">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={gradientStyle}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[#063BAA]/10 flex items-center justify-center">
              <motion.div
                className="w-2 h-2 rounded-full bg-[#063BAA]"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#0A1F4D]">
            {message || "Synchronizing Accounts"}
          </span>
          <span className="text-[10px] text-[#0A1F4D]">
            Establishing secure bank-grade connection...
          </span>
        </div>
      </div>
    );
  }

  // 6. INLINE / DEFAULT LOADER
  return (
    <div className="flex items-center gap-2 py-1 select-none">
      <motion.div
        className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-[#063BAA]"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {message && <span className="text-xs text-[#0A1F4D] font-funnel">{message}</span>}
    </div>
  );
}

// ----------------------------------------------------
// SKELETON LOADER COMPONENT
// ----------------------------------------------------
export function SkeletonLoader() {
  return (
    <div className="space-y-4 w-full select-none">
      <div className="bg-white border border-slate-100 rounded-card p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded-md w-1/3 animate-pulse" />
        <div className="h-8 bg-slate-100 rounded-md w-2/3 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-5 bg-slate-100 rounded-full w-20 animate-pulse" />
          <div className="h-5 bg-slate-100 rounded-full w-16 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-100 rounded-card p-4 h-24 space-y-2">
          <div className="h-3.5 bg-slate-100 rounded-md w-1/2 animate-pulse" />
          <div className="h-6 bg-slate-100 rounded-md w-3/4 animate-pulse" />
        </div>
        <div className="bg-white border border-slate-100 rounded-card p-4 h-24 space-y-2">
          <div className="h-3.5 bg-slate-100 rounded-md w-1/2 animate-pulse" />
          <div className="h-6 bg-slate-100 rounded-md w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
