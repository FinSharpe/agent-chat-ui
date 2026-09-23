"use client";

import { useMutation } from "@tanstack/react-query";
import type {
  LoginRequest,
  RegisterRequest,
  VerificationRequiredResponse,
  VerifyEmailRequest,
} from "@/api/generated/auth-apis/models";
import type { AuthLoginResponse, AuthUserResponse } from "../types/auth.types";
import { postAuth } from "../utils/post-auth";

// The proxy routes set the session cookies themselves; these only carry the
// request and surface the backend's message when it refuses.

export function useLoginMutation() {
  return useMutation<AuthLoginResponse, Error, LoginRequest>({
    mutationFn: (body) => postAuth("/api/auth/login", body, "Login failed"),
  });
}

export function useRegisterMutation() {
  return useMutation<VerificationRequiredResponse, Error, RegisterRequest>({
    mutationFn: (body) =>
      postAuth("/api/auth/register", body, "Registration failed"),
  });
}

export function useVerifyEmailMutation() {
  return useMutation<AuthUserResponse, Error, VerifyEmailRequest>({
    mutationFn: (body) =>
      postAuth("/api/auth/verify-email", body, "Verification failed"),
  });
}

export function useResendOtpMutation() {
  return useMutation<VerificationRequiredResponse, Error, string>({
    mutationFn: (email) =>
      postAuth("/api/auth/resend-otp", { email }, "Failed to resend code"),
  });
}
