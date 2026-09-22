import { z } from "zod";
import type { UserResponse } from "@/api/generated/auth-apis/models";
import { OTP_LENGTH } from "../constants/routes";

// Rules mirror the backend's request models (`LoginRequest`, `RegisterRequest`,
// `VerifyEmailRequest`); the copy follows the reference screens. Each screen
// shows one message at a time, so a schema's field order is the order its
// errors are reported in.

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Please enter your password.")
    .max(128, "Password must be at most 128 characters."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Please enter your full name.")
      .max(255, "Name must be at most 255 characters."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters."),
    // Client-side only: never sent to the backend.
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
    if (!values.acceptTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["acceptTerms"],
        message: "Please accept the terms and conditions to proceed.",
      });
    }
  });

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .email("We couldn't tell which email to verify. Go back and try again."),
  token: z
    .string()
    .regex(
      new RegExp(`^\\d{${OTP_LENGTH}}$`),
      `Please enter the complete ${OTP_LENGTH}-digit verification code.`,
    ),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

// --- Proxy response types ---
// These describe what the Next.js proxy routes return to the browser.
// They differ from backend types because the proxy strips tokens into httpOnly cookies.

// POST /api/auth/login — proxy returns { user } on success, or verification-required.
// Flattened interface (not discriminated union) so call sites can check both fields directly.
export interface AuthLoginResponse {
  user?: UserResponse;
  requires_verification?: boolean;
  message?: string;
}

// POST /api/auth/verify-email, POST /api/auth/refresh — proxy returns { user }
export interface AuthUserResponse {
  user: UserResponse;
}
