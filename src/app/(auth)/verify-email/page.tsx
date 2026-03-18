"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import type { VerificationRequiredResponse } from "@/api/generated/auth-apis/models";
import { useAuth } from "@/providers/AuthProvider";
import {
  extractApiError,
  verifyEmailSchema,
  type VerifyEmailFormValues,
  type AuthUserResponse,
} from "@/modules/auth";

const inputClass =
  "h-12 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:bg-white/[0.07] focus-visible:border-[#42d4a3]/40 focus-visible:ring-[#42d4a3]/15 transition-all duration-300";

const btnClass =
  "relative h-12 w-full overflow-hidden rounded-xl border-0 bg-gradient-to-r from-[#2563eb] to-[#0d9488] text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] hover:from-[#3b82f6] hover:to-[#14b8a6] active:scale-[0.98]";

const RESEND_COOLDOWN = 60;

function VerifyEmailForm() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const verifyMutation = useMutation<
    AuthUserResponse,
    Error,
    VerifyEmailFormValues
  >({
    mutationFn: async (body) => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(extractApiError(data, "Verification failed"));
      return data;
    },
  });
  const resendMutation = useMutation<
    VerificationRequiredResponse,
    Error,
    string
  >({
    mutationFn: async (email) => {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(extractApiError(data, "Failed to resend code"));
      return data;
    },
  });

  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email, token: "" },
  });

  const tokenValue = watch("token");

  // Keep email in sync with search params
  useEffect(() => {
    if (email) setValue("email", email);
  }, [email, setValue]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(
      () => setResendCountdown((c) => c - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const onSubmit = (values: VerifyEmailFormValues) => {
    verifyMutation.mutate(values, {
      onSuccess: (data) => {
        updateUser(data.user);
        router.push("/");
      },
    });
  };

  const handleResend = useCallback(() => {
    if (resendCountdown > 0 || !email) return;
    setResendMessage(null);

    resendMutation.mutate(email, {
      onSuccess: () => {
        setResendMessage("Verification code sent!");
        setResendCountdown(RESEND_COOLDOWN);
      },
    });
  }, [email, resendCountdown, resendMutation]);

  return (
    <Card className="border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/30 rounded-2xl py-6">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white tracking-tight">
          Verify your email
        </CardTitle>
        <CardDescription className="text-white/40">
          {email ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-white/70">{email}</span>
            </>
          ) : (
            "Enter the 6-digit code sent to your email"
          )}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-5">
          {verifyMutation.error && (
            <motion.div
              className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {verifyMutation.error.message}
            </motion.div>
          )}

          {resendMutation.error && (
            <motion.div
              className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {resendMutation.error.message}
            </motion.div>
          )}

          {resendMessage && (
            <motion.div
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-sm text-emerald-400"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {resendMessage}
            </motion.div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="token"
              className="text-[11px] uppercase tracking-wider text-white/50 font-medium"
            >
              Verification code
            </Label>
            <div className="group relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 transition-colors duration-300 group-focus-within:text-[#42d4a3]" />
              <Input
                id="token"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                autoFocus
                className={`pl-11 text-center text-xl tracking-[0.4em] font-mono ${inputClass} h-14`}
                {...register("token")}
                onChange={(e) => {
                  const cleaned = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);
                  setValue("token", cleaned, { shouldValidate: true });
                }}
              />
            </div>
            {errors.token && (
              <p className="text-xs text-red-400">{errors.token.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className={btnClass}
            disabled={verifyMutation.isPending || tokenValue.length !== 6}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[auth-shimmer_3s_ease-in-out_infinite_1s] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify email"
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              disabled={resendCountdown > 0 || resendMutation.isPending}
              onClick={handleResend}
              className="text-sm text-[#42d4a3] hover:text-[#4ade80]"
            >
              {resendCountdown > 0
                ? `Resend code in ${resendCountdown}s`
                : "Resend code"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/30 rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white tracking-tight">
              Verify your email
            </CardTitle>
            <CardDescription className="text-white/40">
              Loading...
            </CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
