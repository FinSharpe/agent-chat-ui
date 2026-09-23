"use client";

import { useState } from "react";
import { Check, Copy, Lock } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { SectionHeading } from "./McpKit";

interface SetupInstructionsProps {
  enabled: boolean;
  serverUrl: string;
  className?: string;
}

const STEPS = [
  {
    title: "Open Claude Desktop",
    detail: "Go to Settings → Connectors.",
  },
  {
    title: "Add Custom Connector",
    detail: 'Click the button, then choose "Add Custom Connector".',
  },
  {
    title: "Paste the URL above",
    detail: "Leave the Advanced section blank.",
  },
  {
    title: "Sign in with FinSharpe",
    detail: "A browser window will open for authentication.",
  },
];

export function SetupInstructions({
  enabled,
  serverUrl,
  className,
}: SetupInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serverUrl);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — copy the URL manually.");
    }
  };

  return (
    <section className={cn("space-y-3", className)}>
      <SectionHeading
        title="Connect from Claude Desktop"
        sub="Paste this URL into Claude Desktop's custom connector settings."
      />

      <div
        className={cn(
          "glass-card rounded-card relative overflow-hidden p-5",
          !enabled && "pointer-events-none",
        )}
      >
        <div className="glass-tile flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4">
          <code
            className={cn(
              "flex-1 truncate font-mono text-[11px]",
              serverUrl ? "text-[#0A1F4D]" : "text-slate-400",
            )}
          >
            {serverUrl || "Server URL not configured"}
          </code>
          <button
            type="button"
            onClick={copy}
            disabled={!enabled || !serverUrl}
            className="flex shrink-0 items-center gap-1 rounded-full bg-[#DFF9EF] px-3 py-1.5 text-[10px] font-medium text-[#0A1F4D] transition-colors disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check
                  size={12}
                  strokeWidth={2.5}
                  className="text-[#0A9E6E]"
                />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>
        </div>

        <ol className="mt-2">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-3 border-b border-slate-50 py-3.5 last:border-b-0 last:pb-0"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#063BAA]/8 text-[10px] font-medium text-[#063BAA]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#0A1F4D]">
                  {step.title}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-400">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {!enabled && (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]"
            // Token-based veil so it dims the card in either theme.
            style={{
              background: "color-mix(in srgb, var(--card-bg) 72%, transparent)",
            }}
          >
            <div className="glass-nav flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium text-slate-500">
              <Lock size={13} />
              Request access to unlock setup
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
