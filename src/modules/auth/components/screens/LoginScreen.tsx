"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { AUTH_ROUTES } from "../../constants/routes";
import {
  FORGOT_PASSWORD_HREF,
  INPUT_CLASS,
  LABEL_CLASS,
  LINK_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../../constants/styles";
import { useLoginMutation } from "../../hooks/useAuthMutations";
import { useAuthNavigation } from "../../hooks/useAuthNavigation";
import { loginSchema, type LoginFormValues } from "../../types/auth.types";
import { firstFieldError } from "../../utils/post-auth";
import { AuthNotice } from "../shared/AuthNotice";
import { AuthScreenHeader } from "../shared/AuthScreenHeader";

/** Sign In. Honours `?next=` (e.g. `/delete-account` wants the visitor back). */
export default function LoginScreen() {
  const { go, finish } = useAuthNavigation();
  const { updateUser } = useAuth();
  const mutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    mutation.mutate(values, {
      onSuccess: (data) => {
        // An unverified account gets a fresh code instead of a session.
        if (data.requires_verification) {
          go(AUTH_ROUTES.verifyEmail, { email: values.email, from: "login" });
          return;
        }
        if (data.user) updateUser(data.user);
        finish();
      },
    });
  };

  const error =
    firstFieldError(errors, ["email", "password"] as const) ??
    mutation.error?.message;
  // Stays busy until the next page takes over, so the form can't be resent.
  const busy = mutation.isPending || mutation.isSuccess;

  return (
    <div className="font-funnel relative flex h-full w-full flex-1 flex-col overflow-hidden bg-transparent px-5 py-6 select-none">
      <AuthScreenHeader
        title="Sign In"
        onBack={() => go(AUTH_ROUTES.choice)}
        className="mb-6"
      />

      <div className="scrollbar-none flex flex-1 flex-col justify-between overflow-y-auto pb-4">
        <div className="space-y-6">
          <div>
            <h2 className="font-geist text-2xl font-medium tracking-tight text-[#0A1F4D]">
              Welcome Back
            </h2>
            <p className="mt-1.5 text-sm text-[#0A1F4D]">
              Sign in to view your connected wealth portfolio.
            </p>
          </div>

          {error && <AuthNotice>{error}</AuthNotice>}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className={LABEL_CLASS}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="name@email.com"
                autoComplete="email"
                className={INPUT_CLASS}
                {...register("email")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label
                  htmlFor="login-password"
                  className="text-xs font-medium tracking-wider text-[#0A1F4D] uppercase"
                >
                  Password
                </label>
                <a
                  href={FORGOT_PASSWORD_HREF}
                  className="text-xs font-medium text-[#063BAA]"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={INPUT_CLASS}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 text-[#0A1F4D] focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className={PRIMARY_BUTTON_CLASS}
            >
              {busy ? "Signing In…" : "Sign In"}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => go(AUTH_ROUTES.register)}
            className="w-full text-center text-sm font-medium text-[#0A1F4D]"
          >
            Don&apos;t have an account?{" "}
            <span className={LINK_TEXT_CLASS}>Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
}
