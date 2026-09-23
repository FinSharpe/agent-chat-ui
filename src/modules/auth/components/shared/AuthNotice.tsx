"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthNoticeProps {
  tone?: "error" | "success";
  children: React.ReactNode;
}

// The reference's rose alert. It has no dark styling; the dark: classes keep
// it from reading as a bright pink slab on the dark canvas.
const TONES = {
  error:
    "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300",
  success: "bg-[#97edcc]/20 border-[#97edcc]/40 text-[#0A9E6E]",
} as const;

/** One message above a form: the latest error, or a confirmation. */
export function AuthNotice({ tone = "error", children }: AuthNoticeProps) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-nested flex items-start gap-2 border p-3 text-sm ${TONES[tone]}`}
    >
      <Icon
        size={14}
        className="mt-0.5 shrink-0"
      />
      <span>{children}</span>
    </div>
  );
}
