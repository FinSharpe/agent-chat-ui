"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { FieldLabel, SectionHeading, inputClass } from "./McpKit";

const PRESET_DURATIONS = ["7", "30", "90", "custom"] as const;
type DurationPreset = (typeof PRESET_DURATIONS)[number];

const PRESET_LABELS: Record<DurationPreset, string> = {
  "7": "7 days",
  "30": "30 days",
  "90": "90 days",
  custom: "Custom",
};

const formSchema = z
  .object({
    duration_preset: z.enum(PRESET_DURATIONS),
    custom_days: z
      .number({ invalid_type_error: "Enter a whole number" })
      .int()
      .min(1, "Must be at least 1 day")
      .max(365, "Max 365 days")
      .optional(),
    reason: z.string().max(1000, "Keep it under 1000 characters").optional(),
  })
  .refine(
    (v) => v.duration_preset !== "custom" || typeof v.custom_days === "number",
    {
      path: ["custom_days"],
      message: "Enter a custom duration",
    },
  );

export type RequestGrantFormValues = {
  duration_days: number;
  reason?: string | null;
};

interface RequestGrantFormProps {
  disabled?: boolean;
  isSubmitting?: boolean;
  onSubmit: (values: RequestGrantFormValues) => void;
  className?: string;
}

export function RequestGrantForm({
  disabled = false,
  isSubmitting = false,
  onSubmit,
  className,
}: RequestGrantFormProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration_preset: "7",
      custom_days: undefined,
      reason: "",
    },
  });

  const preset = watch("duration_preset");
  const showCustom = preset === "custom";
  const locked = disabled || isSubmitting;

  const submit = handleSubmit((values) => {
    const duration_days =
      values.duration_preset === "custom"
        ? values.custom_days!
        : Number(values.duration_preset);
    onSubmit({
      duration_days,
      reason: values.reason?.trim() || null,
    });
    reset({ duration_preset: "7", custom_days: undefined, reason: "" });
  });

  return (
    <section className={cn("space-y-3", className)}>
      <SectionHeading
        title="Request Access"
        sub="Admin approval required. You'll be emailed when your request is approved."
      />

      <div className="glass-card rounded-card p-5">
        {disabled && (
          <div className="rounded-nested mb-4 border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400">
            You already have a pending request awaiting admin approval.
          </div>
        )}

        <form onSubmit={submit}>
          {/* `contents` keeps the fieldset out of layout; its children still
              take the spacing. */}
          <fieldset
            disabled={locked}
            className="contents space-y-4"
          >
            <div>
              <FieldLabel>Duration</FieldLabel>
              <Controller
                name="duration_preset"
                control={control}
                render={({ field }) => (
                  <div
                    role="radiogroup"
                    aria-label="Duration"
                    className="glass-tile flex items-center gap-1 rounded-full p-1"
                  >
                    {PRESET_DURATIONS.map((value) => {
                      const selected = field.value === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(value)}
                          className={cn(
                            "flex-1 rounded-full py-2 text-[11px] font-medium transition-colors disabled:opacity-50",
                            selected
                              ? "bg-[#063BAA] text-white"
                              : "text-slate-500 hover:text-[#063BAA]",
                          )}
                        >
                          {PRESET_LABELS[value]}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {showCustom && (
              <div>
                <FieldLabel htmlFor="custom_days">Custom (days)</FieldLabel>
                <input
                  id="custom_days"
                  type="number"
                  min={1}
                  max={365}
                  placeholder="1–365"
                  className={inputClass}
                  {...register("custom_days", { valueAsNumber: true })}
                />
                {errors.custom_days && (
                  <p className="mt-1 text-[10.5px] text-rose-600 dark:text-rose-400">
                    {errors.custom_days.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <FieldLabel htmlFor="reason">
                Reason <span className="text-slate-400">(optional)</span>
              </FieldLabel>
              <textarea
                id="reason"
                rows={3}
                maxLength={1000}
                placeholder="Briefly explain why you need MCP access…"
                className={cn(inputClass, "resize-none")}
                {...register("reason")}
              />
              {errors.reason && (
                <p className="mt-1 text-[10.5px] text-rose-600 dark:text-rose-400">
                  {errors.reason.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="bg-brand-gradient flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98 disabled:pointer-events-none disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Send size={14} />
              )}
              {isSubmitting ? "Requesting…" : "Submit Request"}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
