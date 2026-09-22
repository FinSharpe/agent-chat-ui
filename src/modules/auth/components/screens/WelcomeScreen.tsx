"use client";

import Image from "next/image";
import InteractiveWave from "@/components/InteractiveWave";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { AUTH_ROUTES } from "../../constants/routes";
import {
  OUTLINE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../../constants/styles";
import { useAuthNavigation } from "../../hooks/useAuthNavigation";

/** Where a visitor with no session lands: the mark, the wordmark, two ways in. */
export default function WelcomeScreen() {
  const { go } = useAuthNavigation();
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <div
      className={`font-funnel relative flex h-full w-full flex-1 flex-col overflow-hidden px-5 py-8 select-none ${isDesktopWeb ? "bg-transparent" : "bg-white"}`}
    >
      {/* Decorative brand wave — desktop already has the media card's wave,
          so the screen stays transparent there instead of layering a second,
          differently-coloured one. */}
      {!isDesktopWeb && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <InteractiveWave
            variant="color"
            baseAmplitude={80}
            waveCount={12}
            baseSpeed={0.012}
            baseFrequency={0.0009}
            className="-top-[10%] -left-[20%] h-[120%] w-[140%] rotate-[-8deg]"
          />
        </div>
      )}

      <div className="flex-1" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <Image
          src="/logo/Finsharpe Logo - Icon.svg"
          alt="FinSharpe"
          width={64}
          height={64}
          className="h-16 w-16"
          priority
        />
        <h1 className="font-geist text-3xl font-medium tracking-tight text-[#0A1F4D]">
          FinSharpe
          <span className="bg-[linear-gradient(30deg,var(--color-brand-blue)_0%,var(--color-brand-mint-light)_100%)] bg-clip-text text-transparent">
            GPT
          </span>
        </h1>
      </div>

      <div className="flex-1" />

      <div className="relative z-10 w-full space-y-3 px-2">
        <button
          type="button"
          onClick={() => go(AUTH_ROUTES.choice)}
          className={PRIMARY_BUTTON_CLASS}
        >
          Get Started
        </button>
        <button
          type="button"
          onClick={() => go(AUTH_ROUTES.login)}
          className={OUTLINE_BUTTON_CLASS}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
