"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/shared/PageLoader";
import { useAuth } from "@/providers/AuthProvider";
import {
  AUTH_ROUTES,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
} from "../../constants/routes";
import { PRIMARY_BUTTON_CLASS } from "../../constants/styles";
import {
  useResendOtpMutation,
  useVerifyEmailMutation,
} from "../../hooks/useAuthMutations";
import { useAuthNavigation } from "../../hooks/useAuthNavigation";
import { useCountdown } from "../../hooks/useCountdown";
import { verifyEmailSchema } from "../../types/auth.types";
import { AuthNotice } from "../shared/AuthNotice";
import { AuthScreenHeader } from "../shared/AuthScreenHeader";
import { OtpCells } from "../shared/OtpCells";

const emptyCode = () => Array<string>(OTP_LENGTH).fill("");

/**
 * OTP Verification: the code the backend emailed after sign-up, or after a
 * sign-in to an account that was never verified (`?from=login`).
 */
export default function OtpScreen() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const cameFromLogin = searchParams.get("from") === "login";
  const { go, finish } = useAuthNavigation();
  const { updateUser } = useAuth();

  const verify = useVerifyEmailMutation();
  const resend = useResendOtpMutation();
  const [digits, setDigits] = useState(emptyCode);
  const [formError, setFormError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  // A code was sent on the way here, so the first resend waits a cooldown.
  const [cooldown, restartCooldown] = useCountdown(RESEND_COOLDOWN_SECONDS);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = verifyEmailSchema.safeParse({
      email,
      token: digits.join(""),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    verify.mutate(parsed.data, {
      onSuccess: (data) => {
        updateUser(data.user);
        finish();
      },
    });
  };

  const onResend = () => {
    if (cooldown > 0 || !email || resend.isPending) return;
    setFormError(null);
    setResent(false);
    verify.reset();
    resend.mutate(email, {
      onSuccess: () => {
        setResent(true);
        setDigits(emptyCode());
        restartCooldown(RESEND_COOLDOWN_SECONDS);
      },
    });
  };

  const error = formError ?? verify.error?.message ?? resend.error?.message;
  // Stays on the loader until the app takes over.
  const verifying = verify.isPending || verify.isSuccess;

  return (
    <div className="font-funnel relative flex h-full w-full flex-1 flex-col overflow-hidden bg-transparent p-6 select-none">
      <AuthScreenHeader
        title="OTP Verification"
        onBack={() =>
          go(cameFromLogin ? AUTH_ROUTES.login : AUTH_ROUTES.register)
        }
        className="mb-6"
      />

      {verifying ? (
        <PageLoader />
      ) : (
        <div className="scrollbar-none flex flex-1 flex-col justify-between overflow-y-auto pb-4">
          <div className="space-y-6">
            <div>
              <h2 className="font-geist text-2xl font-medium tracking-tight text-[#0A1F4D]">
                Enter Verification Code
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#0A1F4D]">
                {email ? (
                  <>
                    We&apos;ve sent a {OTP_LENGTH}-digit verification code to
                    your email{" "}
                    <span className="font-medium break-all text-[#0A1F4D]">
                      {email}
                    </span>
                    .
                  </>
                ) : (
                  `Enter the ${OTP_LENGTH}-digit verification code we sent to your email.`
                )}
              </p>
            </div>

            {error ? (
              <AuthNotice>{error}</AuthNotice>
            ) : (
              resent && (
                <AuthNotice tone="success">
                  A new code is on its way to {email}.
                </AuthNotice>
              )
            )}

            <form
              onSubmit={onSubmit}
              noValidate
              className="space-y-6"
            >
              <OtpCells
                digits={digits}
                onChange={setDigits}
              />
              <button
                type="submit"
                className={PRIMARY_BUTTON_CLASS}
              >
                Verify &amp; Complete
              </button>
            </form>

            <div className="text-center">
              {cooldown > 0 ? (
                <span className="text-sm font-medium text-[#0A1F4D]">
                  Resend code in{" "}
                  <span className="font-medium text-[#0A1F4D]">
                    {cooldown}s
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onResend}
                  disabled={!email || resend.isPending}
                  className="text-sm font-medium text-[#063BAA] hover:underline disabled:opacity-60 disabled:hover:no-underline"
                >
                  {resend.isPending ? "Sending…" : "Resend OTP Code"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
