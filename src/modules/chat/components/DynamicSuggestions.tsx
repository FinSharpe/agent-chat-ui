import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface DynamicSuggestionsProps {
  suggestions: string[];
  onSelect: (query: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function DynamicSuggestions({
  suggestions,
  onSelect,
  disabled,
  className,
}: DynamicSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-text-muted uppercase">
        <Sparkles className="size-3" />
        Suggested follow-ups
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${index}-${suggestion}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(suggestion)}
            className={cn(
              "rounded-full border border-border-default bg-bg-card px-3 py-1.5 text-xs text-text-secondary transition-all duration-150",
              "hover:border-primary-main-light/40 hover:bg-bg-hover hover:text-text-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
