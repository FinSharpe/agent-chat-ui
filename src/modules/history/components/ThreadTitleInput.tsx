import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ThreadTitleInputProps {
  initialValue: string;
  /** The first message's title, shown when the field is emptied. */
  placeholder: string;
  className?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

/**
 * Inline rename field: Enter or leaving the field saves, Escape cancels. It
 * takes the row title's own type and height, so a row does not jump when it
 * switches into editing; only a brand-blue underline marks it as a field.
 */
export default function ThreadTitleInput({
  initialValue,
  placeholder,
  className,
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
        "font-geist h-[1.5em] min-w-0 flex-1 border-0 border-b border-[#063BAA]/40 bg-transparent p-0 text-[13px] leading-[1.5] font-medium text-[#0A1F4D] placeholder-[#0A1F4D]/40 outline-none focus:border-[#063BAA] dark:placeholder-white/40",
        className,
      )}
    />
  );
}
