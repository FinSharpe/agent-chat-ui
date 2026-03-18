"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import type { VerificationRequiredResponse } from "@/api/generated/auth-apis/models";
import {
  extractApiError,
  registerSchema,
  type RegisterFormValues,
} from "@/modules/auth";

const inputClass =
  "h-12 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:bg-white/[0.07] focus-visible:border-[#42d4a3]/40 focus-visible:ring-[#42d4a3]/15 transition-all duration-300";

const btnClass =
  "relative h-12 w-full overflow-hidden rounded-xl border-0 bg-gradient-to-r from-[#2563eb] to-[#0d9488] text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] hover:from-[#3b82f6] hover:to-[#14b8a6] active:scale-[0.98]";

export default function RegisterPage() {
  const router = useRouter();
  const mutation = useMutation<
    VerificationRequiredResponse,
    Error,
    RegisterFormValues
  >({
    mutationFn: async (body) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(extractApiError(data, "Registration failed"));
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (values: RegisterFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        router.push(
          `/verify-email?email=${encodeURIComponent(getValues("email"))}`,
        );
      },
    });
  };

  return (
    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] py-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Create an account
        </CardTitle>
        <CardDescription className="text-white/40">
          Join the next generation of intelligent investing
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-5">
          {mutation.error && (
            <motion.div
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {mutation.error.message}
            </motion.div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="name"
              className="text-[11px] uppercase tracking-wider text-white/50 font-medium"
            >
              Name
            </Label>
            <div className="group relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 transition-colors duration-300 group-focus-within:text-[#42d4a3]" />
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                autoFocus
                className={`pl-11 ${inputClass}`}
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
              className="text-[11px] uppercase tracking-wider text-white/50 font-medium"
            >
              Email
            </Label>
            <div className="group relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 transition-colors duration-300 group-focus-within:text-[#42d4a3]" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={`pl-11 ${inputClass}`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="text-[11px] uppercase tracking-wider text-white/50 font-medium"
            >
              Password
            </Label>
            <div className="group relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 transition-colors duration-300 group-focus-within:text-[#42d4a3] z-10" />
              <PasswordInput
                id="password"
                placeholder="Choose a strong password"
                autoComplete="new-password"
                className={`pl-11 ${inputClass}`}
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className={btnClass}
            disabled={mutation.isPending}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[auth-shimmer_3s_ease-in-out_infinite_1s] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </CardContent>
      </form>

      <CardFooter className="justify-center">
        <p className="text-sm text-white/40">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#42d4a3] transition-colors hover:text-[#4ade80]"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
