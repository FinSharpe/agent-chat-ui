"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import OverlayColumn from "@/components/shared/OverlayColumn";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { ASSISTANT_TOOLS } from "../constants/assistantTools";
import { useSpinWheel } from "../hooks/useSpinWheel";

// Radial ring geometry (px).
const R = 118; // radius of the tool circle
const SIZE = 300; // ring box
const CENTRE = SIZE / 2;
const TOOL = 54; // tool button diameter
const HUB = 92; // centre hub diameter
const EASE = "0.32s cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Sparkle button → a wheel of eight guided modes. Spin (or tap) a mode to
 * the top, then "Start Chat" opens a fresh chat seeded with its prompt.
 */
export default function AssistantModeOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  const { createNewChat } = useAppNavigation();
  const {
    ringRef,
    rotation,
    isDragging,
    activeIndex,
    step,
    onPointerDown,
    rotateTo,
  } = useSpinWheel(ASSISTANT_TOOLS.length);
  const selected = ASSISTANT_TOOLS[activeIndex];
  const SelectedIcon = selected.icon;
  const transition = isDragging ? "none" : `transform ${EASE}`;

  const handleStartChat = () => {
    createNewChat(selected.prompt);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="font-funnel pointer-events-auto absolute inset-0 z-[60] flex flex-col overflow-hidden bg-white select-none"
    >
      <OverlayColumn>
        {/* Header */}
        <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-slate-50 px-5">
          <div className="flex items-center gap-2">
            <Sparkles
              size={16}
              className="text-[#063BAA]"
            />
            <span className="font-geist text-sm font-medium text-[#0A1F4D]">
              Assistant Mode
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover-tint flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-[#0A1F4D] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="scrollbar-none flex flex-1 flex-col items-center justify-between overflow-y-auto px-5 py-6">
          <p className="max-w-[280px] text-center text-[11px] leading-relaxed text-slate-400">
            An interactive experience curated by experts. Spin the wheel to pick
            a mode.
          </p>

          {/* Radial hub — drag anywhere on the ring to spin it */}
          <div
            ref={ringRef}
            className="relative my-4 shrink-0 touch-none"
            style={{ width: SIZE, height: SIZE }}
          >
            {/* Marks the selected position */}
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#063BAA]" />

            {/* Rotating layer: guide ring + the tools */}
            <div
              onPointerDown={onPointerDown}
              className={`absolute inset-0 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ transform: `rotate(${rotation}deg)`, transition }}
            >
              <div
                className="absolute rounded-full border border-dashed border-[#063BAA]/15"
                style={{
                  inset: CENTRE - R - 24,
                  width: (R + 24) * 2,
                  height: (R + 24) * 2,
                }}
              />

              {ASSISTANT_TOOLS.map((tool, i) => {
                const angle = (-90 + i * step) * (Math.PI / 180);
                const Icon = tool.icon;
                const isActive = i === activeIndex;
                return (
                  <button
                    key={tool.id}
                    onClick={() => rotateTo(i)}
                    aria-label={tool.name}
                    aria-pressed={isActive}
                    title={tool.name}
                    className={`absolute flex h-[54px] w-[54px] items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? "bg-[#063BAA] text-white shadow-md shadow-blue-900/20"
                        : "glass-card text-[#0A1F4D]"
                    }`}
                    style={{
                      left: CENTRE + R * Math.cos(angle) - TOOL / 2,
                      top: CENTRE + R * Math.sin(angle) - TOOL / 2,
                      // Counter-rotate so icons stay upright as the wheel turns.
                      transform: `rotate(${-rotation}deg) scale(${isActive ? 1.1 : 1})`,
                      transition,
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={2}
                    />
                  </button>
                );
              })}
            </div>

            {/* Centre hub — outside the rotating layer so it never spins */}
            <div
              className="bg-brand-gradient pointer-events-none absolute flex flex-col items-center justify-center rounded-full text-white shadow-lg shadow-blue-900/20"
              style={{
                left: CENTRE - HUB / 2,
                top: CENTRE - HUB / 2,
                width: HUB,
                height: HUB,
              }}
            >
              <SelectedIcon
                size={26}
                strokeWidth={2}
              />
              <span className="mt-1 px-2 text-center text-[8px] leading-tight font-medium tracking-wider uppercase">
                {selected.name.split(" ")[0]}
              </span>
            </div>
          </div>

          {/* Description + Start Chat */}
          <div className="glass-card rounded-card w-full max-w-[340px] space-y-3.5 p-6 text-center">
            <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">
              {selected.name}
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {selected.desc}
            </p>
            <button
              onClick={handleStartChat}
              className="bg-brand-gradient flex w-full items-center justify-center gap-1.5 rounded-full px-6 py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98"
            >
              Start Chat <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </OverlayColumn>
    </motion.div>
  );
}
