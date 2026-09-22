"use client";

import { Check, Clock, RefreshCw, X } from "lucide-react";
import React, { useMemo } from "react";

import { cn } from "@/lib/utils";

/**
 * Type definitions matching the backend schema
 */
export interface ReportStep {
    name: string;
    status: "pending" | "in_progress" | "completed" | "error";
    message?: string;
}

export interface ReportStatusProps {
    title: string;
    steps: ReportStep[];
    is_complete: boolean;
    report_id?: string;
}

function StepIcon({ status }: { status: ReportStep["status"] }) {
    if (status === "completed") {
        return (
            <span className="flex size-6 items-center justify-center rounded-full bg-[#97edcc]/25 text-[#0A9E6E]">
                <Check size={13} strokeWidth={2.5} />
            </span>
        );
    }
    if (status === "in_progress") {
        return (
            <span className="flex size-6 items-center justify-center rounded-full bg-[#063BAA]/8 text-[#063BAA]">
                <RefreshCw size={12} className="animate-spin" />
            </span>
        );
    }
    if (status === "error") {
        return (
            <span className="flex size-6 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
                <X size={13} strokeWidth={2.5} />
            </span>
        );
    }
    return (
        <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Clock size={12} />
        </span>
    );
}

export function ReportStatus(props: ReportStatusProps) {
    const { title, steps } = props;
    // Stays on screen with its completed steps until the final report message
    // replaces it or the user navigates away.

    const completedCount = useMemo(
        () => steps.filter((s) => s.status === "completed").length,
        [steps]
    );
    const totalCount = steps.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    return (
        <div className="glass-card rounded-card w-full max-w-md space-y-4 p-5">
            <div className="space-y-2.5">
                <h3 className="font-geist text-sm font-medium leading-tight text-[#0A1F4D]">
                    {title}
                </h3>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">
                            {completedCount} of {totalCount} steps completed
                        </span>
                        <span className="font-medium text-[#0A1F4D] tabular-nums">
                            {progressPercent}%
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="bg-brand-gradient h-full rounded-full transition-all duration-500 ease-in-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2.5">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="shrink-0">
                            <StepIcon status={step.status} />
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <span
                                className={cn(
                                    "text-[11px] font-medium",
                                    step.status === "pending" && "text-slate-400",
                                    step.status === "in_progress" && "text-[#0A1F4D]",
                                    step.status === "completed" && "text-slate-500",
                                    step.status === "error" && "text-rose-600"
                                )}
                            >
                                {step.name}
                            </span>
                            {step.message && (
                                <span className="text-[10px] text-slate-400">
                                    {step.message}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ReportStatus;
