"use client";

import { useRef } from "react";

interface OtpCellsProps {
  /** One entry per cell, each "" or a single digit. */
  digits: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
}

/**
 * The reference's one-digit cells, sized to fit six across the auth column.
 * Typing moves forward, Backspace on an empty cell moves back, and a pasted or
 * autofilled code (iOS offers it on the first cell) fills the cells from the
 * one it landed in — or from the first, when it is a whole code.
 */
export function OtpCells({ digits, onChange, disabled }: OtpCellsProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (index: number) =>
    refs.current[Math.max(0, Math.min(index, digits.length - 1))]?.focus();

  /** Write `chars` into the cells starting at `index`, then focus the next one. */
  const write = (index: number, chars: string) => {
    const next = [...digits];
    let at = index;
    for (const ch of chars) {
      if (at >= next.length) break;
      next[at] = ch;
      at += 1;
    }
    onChange(next);
    focus(at);
  };

  const onInput = (index: number, raw: string) => {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) {
      const next = [...digits];
      next[index] = "";
      onChange(next);
      return;
    }
    const current = digits[index];
    // A keystroke into a filled cell arrives as two characters: keep the new one.
    if (current && incoming.length === 2) {
      write(index, incoming.startsWith(current) ? incoming[1] : incoming[0]);
      return;
    }
    write(index, incoming);
  };

  const onPaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    write(pasted.length >= digits.length ? 0 : index, pasted);
  };

  const onKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      onChange(next);
      focus(index - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(index + 1);
    }
  };

  return (
    <div className="flex justify-center gap-2 py-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1} of ${digits.length}`}
          value={digit}
          disabled={disabled}
          autoFocus={index === 0}
          onChange={(e) => onInput(index, e.target.value)}
          onPaste={(e) => onPaste(index, e)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className="glass-tile rounded-nested font-geist h-16 w-0 max-w-14 min-w-0 flex-1 text-center text-xl font-medium text-[#0A1F4D] shadow-xs focus:border-[#063BAA]/45 focus:outline-none"
        />
      ))}
    </div>
  );
}
