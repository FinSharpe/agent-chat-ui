import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, MessageCircleQuestion } from "lucide-react";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

function isUrl(value: any): boolean {
  if (typeof value !== "string") return false;
  try {
    new URL(value);
    return value.startsWith("http://") || value.startsWith("https://");
  } catch {
    return false;
  }
}

function renderInterruptStateItem(value: any): React.ReactNode {
  if (isComplexValue(value)) {
    return (
      <code className="block rounded-tile bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] break-words whitespace-pre-wrap text-[#0A1F4D]">
        {JSON.stringify(value, null, 2)}
      </code>
    );
  } else if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-[#063BAA] underline-offset-2 hover:underline"
      >
        {value}
      </a>
    );
  } else {
    return String(value);
  }
}

export function GenericInterruptView({
  interrupt,
}: {
  interrupt: Record<string, any> | Record<string, any>[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const contentStr = JSON.stringify(interrupt, null, 2);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;

  // Function to truncate long string values (but preserve URLs)
  const truncateValue = (value: any): any => {
    if (typeof value === "string" && value.length > 100) {
      // Don't truncate URLs so they remain clickable
      if (isUrl(value)) {
        return value;
      }
      return value.substring(0, 100) + "...";
    }

    if (Array.isArray(value) && !isExpanded) {
      return value.slice(0, 2).map(truncateValue);
    }

    if (isComplexValue(value) && !isExpanded) {
      const strValue = JSON.stringify(value, null, 2);
      if (strValue.length > 100) {
        // Return plain text for truncated content instead of a JSON object
        return `Truncated ${strValue.length} characters...`;
      }
    }

    return value;
  };

  // Process entries based on expanded state
  const processEntries = () => {
    if (Array.isArray(interrupt)) {
      return isExpanded ? interrupt : interrupt.slice(0, 5);
    } else {
      const entries = Object.entries(interrupt);
      if (!isExpanded && shouldTruncate) {
        // When collapsed, process each value to potentially truncate it
        return entries.map(([key, value]) => [key, truncateValue(value)]);
      }
      return entries;
    }
  };

  const displayEntries = processEntries();

  return (
    <div className="glass-card rounded-card font-funnel mt-3 w-full overflow-hidden p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]">
          <MessageCircleQuestion size={16} />
        </div>
        <div className="min-w-0">
          <span className="block text-[9px] font-medium tracking-wider text-slate-400 uppercase">
            Human interrupt
          </span>
          <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">
            The assistant is waiting on you
          </h3>
        </div>
      </div>
      <motion.div
        className="mt-4 min-w-full"
        initial={false}
        animate={{ height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          <motion.div
            key={isExpanded ? "expanded" : "collapsed"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="rounded-nested border border-slate-100 px-4"
            style={{
              maxHeight: isExpanded ? "none" : "500px",
              overflow: "auto",
            }}
          >
            <table className="min-w-full">
              <tbody>
                {displayEntries.map((item, argIdx) => {
                  const [key, value] = Array.isArray(interrupt)
                    ? [argIdx.toString(), item]
                    : (item as [string, any]);
                  return (
                    <tr
                      key={argIdx}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-2.5 pr-4 align-top text-[11px] font-medium whitespace-nowrap text-slate-400">
                        {key}
                      </td>
                      <td className="py-2.5 text-[12px] leading-relaxed break-words text-[#0A1F4D]">
                        {renderInterruptStateItem(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </AnimatePresence>
        {(shouldTruncate ||
          (Array.isArray(interrupt) && interrupt.length > 5)) && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover-tint mt-2 flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-full text-[11px] font-medium text-slate-400 transition-colors hover:text-[#063BAA]"
            initial={{ scale: 1 }}
            whileTap={{ scale: 0.98 }}
          >
            {isExpanded ? "Show less" : "Show more"}
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
