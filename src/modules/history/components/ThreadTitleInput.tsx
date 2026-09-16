import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ThreadTitleInputProps {
  initialValue: string;
  /** The first message's title, shown when the field is emptied. */
  placeholder: string;
  dark?: boolean;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

/**
 * Inline rename field: Enter or leaving the field saves, Escape cancels. Sized
 * to the card title (an `h3`, `text-lg` at line-height 1.5) so the row keeps
 * its height.
 */
export default function ThreadTitleInput({
  initialValue,
  placeholder,
  dark = false,
  onCommit,
  onCancel,
}: ThreadTitleInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  // Escape and Enter both blur the field; only the first outcome counts.
  const settled = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = (commit: boolean) => {
    if (settled.current) return;
    settled.current = true;
    if (commit) onCommit(value);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={value}
      placeholder={placeholder}
      aria-label="Chat title"
      maxLength={200}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") finish(true);
        else if (e.key === "Escape") finish(false);
      }}
      className={cn(
        "-mx-1.5 h-[1.5em] w-[calc(100%+0.75rem)] min-w-0 rounded-md border px-1.5 py-0 text-lg font-medium outline-none",
        dark
          ? "border-white/15 bg-white/[0.06] text-white/90 placeholder:text-white/35 focus:border-blue-400/60"
          : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500",
      )}
    />
  );
}
