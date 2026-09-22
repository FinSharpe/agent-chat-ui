import { useState } from "react";
import { ChevronRight, Copy, CopyCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  value: unknown;
  defaultExpandDepth?: number;
  maxHeight?: string;
  copyLabel?: string;
  className?: string;
  /** Render without the outer border/background and copy toolbar, so the tree
   *  can sit inside a host container that supplies its own chrome. */
  bare?: boolean;
}

type JsonPrimitive = string | number | boolean | null;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isContainer(v: unknown): v is Record<string, unknown> | unknown[] {
  return Array.isArray(v) || isObject(v);
}

function safeStringify(v: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    v,
    (_, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    },
    2,
  );
}

export function JsonViewer({
  value,
  defaultExpandDepth = 1,
  maxHeight = "40vh",
  copyLabel = "Copy JSON",
  className,
  bare = false,
}: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(safeStringify(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (bare) {
    return (
      <div
        className={cn(
          "overflow-auto p-3 font-mono text-[12px] leading-relaxed text-[#0A1F4D]",
          className,
        )}
        style={{ maxHeight }}
      >
        <JsonNode
          value={value}
          depth={0}
          defaultExpandDepth={defaultExpandDepth}
          isLast
          ancestors={[]}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-nested border border-slate-100 bg-white",
        className,
      )}
    >
      <div className="flex items-center justify-end border-b border-slate-50 bg-slate-50 px-2 py-1">
        <button
          onClick={handleCopy}
          className="hover-tint flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-[#063BAA]"
          aria-label={copyLabel}
        >
          <AnimatePresence
            mode="wait"
            initial={false}
          >
            {copied ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <CopyCheck className="h-3.5 w-3.5 text-[#0A9E6E]" />
                Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                {copyLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <div
        className="overflow-auto p-3 font-mono text-[12px] leading-relaxed text-[#0A1F4D]"
        style={{ maxHeight }}
      >
        <JsonNode
          value={value}
          depth={0}
          defaultExpandDepth={defaultExpandDepth}
          isLast
          ancestors={[]}
        />
      </div>
    </div>
  );
}

interface JsonNodeProps {
  keyLabel?: string | number;
  value: unknown;
  depth: number;
  defaultExpandDepth: number;
  isLast: boolean;
  ancestors: readonly object[];
}

function JsonNode({
  keyLabel,
  value,
  depth,
  defaultExpandDepth,
  isLast,
  ancestors,
}: JsonNodeProps) {
  const [expanded, setExpanded] = useState(depth < defaultExpandDepth);

  const isContainerValue = isContainer(value);
  const isCircular =
    isContainerValue && ancestors.includes(value as object);

  if (isCircular) {
    return (
      <LeafLine
        keyLabel={keyLabel}
        valueNode={
          <span className="text-slate-400 italic">[Circular]</span>
        }
        isLast={isLast}
      />
    );
  }

  if (!isContainerValue) {
    return (
      <LeafLine
        keyLabel={keyLabel}
        valueNode={<PrimitiveValue value={value as JsonPrimitive} />}
        isLast={isLast}
      />
    );
  }

  const entries: ReadonlyArray<readonly [string | number, unknown]> =
    Array.isArray(value)
      ? value.map((v, i) => [i, v] as const)
      : Object.entries(value);

  const isEmpty = entries.length === 0;
  const openBracket = Array.isArray(value) ? "[" : "{";
  const closeBracket = Array.isArray(value) ? "]" : "}";
  const summary = Array.isArray(value)
    ? `${entries.length} item${entries.length === 1 ? "" : "s"}`
    : `${entries.length} key${entries.length === 1 ? "" : "s"}`;

  const childAncestors = [...ancestors, value as object];

  return (
    <div>
      <div className="flex items-start">
        {isEmpty ? (
          <span className="inline-block h-5 w-4 flex-shrink-0" />
        ) : (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex h-5 w-4 flex-shrink-0 items-center justify-center text-slate-400 hover:text-[#063BAA]"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {keyLabel !== undefined && (
            <>
              <span className="font-medium text-[#063BAA]">
                {typeof keyLabel === "number"
                  ? keyLabel
                  : JSON.stringify(keyLabel)}
              </span>
              <span className="text-slate-400">: </span>
            </>
          )}
          {isEmpty ? (
            <span className="text-slate-400">
              {openBracket}
              {closeBracket}
              {!isLast && ","}
            </span>
          ) : expanded ? (
            <span className="text-slate-400">{openBracket}</span>
          ) : (
            <>
              <span className="text-slate-400">{openBracket}</span>
              <span className="px-1 font-sans text-[11px] text-slate-400">{summary}</span>
              <span className="text-slate-400">
                {closeBracket}
                {!isLast && ","}
              </span>
            </>
          )}
        </div>
      </div>
      {expanded && !isEmpty && (
        <>
          <div className="ml-[7px] border-l border-slate-100 pl-3">
            {entries.map(([k, v], idx) => (
              <JsonNode
                key={String(k)}
                keyLabel={k}
                value={v}
                depth={depth + 1}
                defaultExpandDepth={defaultExpandDepth}
                isLast={idx === entries.length - 1}
                ancestors={childAncestors}
              />
            ))}
          </div>
          <div className="flex items-start">
            <span className="inline-block h-5 w-4 flex-shrink-0" />
            <span className="text-slate-400">
              {closeBracket}
              {!isLast && ","}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function LeafLine({
  keyLabel,
  valueNode,
  isLast,
}: {
  keyLabel?: string | number;
  valueNode: React.ReactNode;
  isLast: boolean;
}) {
  return (
    <div className="flex items-start">
      <span className="inline-block h-5 w-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {keyLabel !== undefined && (
          <>
            <span className="font-medium text-[#063BAA]">
              {typeof keyLabel === "number"
                ? keyLabel
                : JSON.stringify(keyLabel)}
            </span>
            <span className="text-slate-400">: </span>
          </>
        )}
        {valueNode}
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    </div>
  );
}

function PrimitiveValue({ value }: { value: JsonPrimitive }) {
  if (value === null) {
    return <span className="text-slate-400 italic">null</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-[#0A1F4D]">{String(value)}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-amber-600 tabular-nums">{value}</span>;
  }
  if (typeof value === "string") {
    return <StringValue value={value} />;
  }
  return <span className="text-slate-400">{String(value)}</span>;
}

function StringValue({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 500;
  const tooLong = value.length > LIMIT;
  const display = tooLong && !expanded ? value.slice(0, LIMIT) + "…" : value;

  return (
    <span className="break-all whitespace-pre-wrap text-[#0A9E6E]">
      {JSON.stringify(display)}
      {tooLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="hover-tint ml-2 rounded-full px-2 py-0.5 font-sans text-[11px] font-medium text-slate-500 hover:text-[#063BAA]"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </span>
  );
}
