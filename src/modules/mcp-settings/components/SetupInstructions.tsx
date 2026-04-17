"use client";

import { useState } from "react";
import { Check, Copy, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    detail: "Click the button, then choose \"Add Custom Connector\".",
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
    <Card
      className={cn(
        "relative overflow-hidden py-4",
        !enabled && "pointer-events-none",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-base">Connect from Claude Desktop</CardTitle>
        <CardDescription>
          Paste this URL into Claude Desktop&apos;s custom connector settings.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div
          className={cn(
            "group flex items-center gap-2 rounded-lg border border-border-default bg-bg-subtle px-3 py-2.5",
          )}
        >
          <code className="flex-1 truncate font-mono text-sm text-text-primary">
            {serverUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            disabled={!enabled}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-success-fg" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>

        <ol className="mt-6 space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  "bg-primary-paper text-xs font-semibold text-primary-main-light",
                )}
              >
                {i + 1}
              </span>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium text-text-primary">
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>

      {!enabled && (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-bg-card/70 backdrop-blur-[2px]"
        >
          <div className="flex items-center gap-2 rounded-full border border-border-default bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm">
            <Lock className="size-3.5 text-text-tertiary" />
            Request access to unlock setup
          </div>
        </div>
      )}
    </Card>
  );
}
