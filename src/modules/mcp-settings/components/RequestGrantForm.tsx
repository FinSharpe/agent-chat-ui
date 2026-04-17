"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRESET_DURATIONS = ["7", "30", "90", "custom"] as const;
type DurationPreset = (typeof PRESET_DURATIONS)[number];

const formSchema = z
  .object({
    duration_preset: z.enum(PRESET_DURATIONS),
    custom_days: z
      .number({ invalid_type_error: "Enter a whole number" })
      .int()
      .min(1, "Must be at least 1 day")
      .max(365, "Max 365 days")
      .optional(),
    reason: z
      .string()
      .max(1000, "Keep it under 1000 characters")
      .optional(),
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
    <Card className={cn("overflow-hidden py-4", className)}>
      <CardHeader>
        <CardTitle className="text-base">Request access</CardTitle>
        <CardDescription>
          Admin approval required. You&apos;ll be emailed when your request is
          approved.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {disabled && (
          <div className="mb-4 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-sm text-warning-fg">
            You already have a pending request awaiting admin approval.
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <fieldset disabled={disabled || isSubmitting} className="contents">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-1.5">
                <Label htmlFor="duration_preset" className="text-xs font-medium text-text-secondary">
                  Duration
                </Label>
                <Controller
                  name="duration_preset"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as DurationPreset)}
                      disabled={disabled || isSubmitting}
                    >
                      <SelectTrigger id="duration_preset">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="custom">Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {showCustom && (
                <div className="space-y-1.5">
                  <Label htmlFor="custom_days" className="text-xs font-medium text-text-secondary">
                    Custom (days)
                  </Label>
                  <Input
                    id="custom_days"
                    type="number"
                    min={1}
                    max={365}
                    placeholder="1–365"
                    {...register("custom_days", { valueAsNumber: true })}
                  />
                  {errors.custom_days && (
                    <p className="text-xs text-error-fg">
                      {errors.custom_days.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-medium text-text-secondary">
                Reason <span className="text-text-tertiary">(optional)</span>
              </Label>
              <Textarea
                id="reason"
                rows={3}
                maxLength={1000}
                placeholder="Briefly explain why you need MCP access…"
                {...register("reason")}
              />
              {errors.reason && (
                <p className="text-xs text-error-fg">
                  {errors.reason.message}
                </p>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button type="submit" className="gap-2">
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {isSubmitting ? "Requesting…" : "Submit request"}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
