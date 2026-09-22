"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Volume2 } from "lucide-react";

/** Markdown and tables read badly aloud; keep the words only. */
function toSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*\|?\s*:?-{2,}.*$/gm, " ")
    .replace(/[#*_`>|~]/g, " ")
    .replace(/\n+/g, ". ")
    .replace(/\s{2,}/g, " ")
    .replace(/(\.\s*){2,}/g, ". ")
    .trim();
}

/**
 * Reads an answer aloud with the browser's speech synthesis (the reference
 * HearOutputCard). Hidden where the browser cannot speak rather than faking
 * playback.
 */
export default function HearOutputCard({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speech = useMemo(() => toSpeech(text), [text]);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // Stop this card's narration when it goes away (thread switch, new chat).
  useEffect(
    () => () => {
      if (utteranceRef.current && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    },
    [],
  );

  if (!supported || !speech) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (playing) {
      synth.cancel();
      setPlaying(false);
      return;
    }
    // One voice at a time: starting here silences any other answer.
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(speech);
    utterance.rate = 1.02;
    const done = () => {
      if (utteranceRef.current === utterance) utteranceRef.current = null;
      setPlaying(false);
    };
    utterance.onend = done;
    utterance.onerror = done;
    utteranceRef.current = utterance;
    synth.speak(utterance);
    setPlaying(true);
  };

  return (
    <div className="glass-card flex items-center gap-3 rounded-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]">
        <Volume2 size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#0A1F4D]">Hear Output</p>
        <p className="text-[10px] text-slate-400">
          {playing ? "Playing audio…" : "Listen to this analysis"}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Stop audio" : "Play audio"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 ${
          playing ? "chat-stop-btn bg-rose-50 text-rose-600" : "bg-brand-gradient text-white"
        }`}
      >
        {playing ? (
          <Square
            size={14}
            fill="currentColor"
          />
        ) : (
          <Play
            size={14}
            fill="currentColor"
            className="ml-0.5"
          />
        )}
      </button>
    </div>
  );
}
