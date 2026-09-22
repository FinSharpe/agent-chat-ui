import { cn } from "@/lib/utils";

interface DynamicSuggestionsProps {
  suggestions: string[];
  onSelect: (query: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * "Suggested next steps" under the latest answer — the agent's real
 * `next_prompt_suggestions`, drawn as the reference's follow-up rows.
 */
export default function DynamicSuggestions({
  suggestions,
  onSelect,
  disabled,
  className,
}: DynamicSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className={cn("flex flex-col gap-2 select-none", className)}>
      <span className="px-1 text-[9px] font-medium tracking-wider text-slate-400 uppercase">
        Suggested next steps
      </span>
      {suggestions.map((suggestion, index) => (
        <button
          key={`${index}-${suggestion}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="glass-card hover-tint w-full rounded-nested px-3.5 py-2 text-left text-[12px] leading-normal font-medium text-[#0A1F4D] transition-all hover:text-[#063BAA] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
