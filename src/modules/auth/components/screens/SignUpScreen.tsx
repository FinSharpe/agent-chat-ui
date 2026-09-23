"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageLoader } from "@/components/shared/PageLoader";
import { AUTH_ROUTES } from "../../constants/routes";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  LINK_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
  PRIVACY_URL,
} from "../../constants/styles";
import { useRegisterMutation } from "../../hooks/useAuthMutations";
import { useAuthNavigation } from "../../hooks/useAuthNavigation";
import {
  registerSchema,
  type RegisterFormValues,
} from "../../types/auth.types";
import { firstFieldError } from "../../utils/post-auth";
import { AuthNotice } from "../shared/AuthNotice";
import { AuthScreenHeader } from "../shared/AuthScreenHeader";

const FIELD_ORDER = [
  "name",
  "email",
  "password",
  "confirmPassword",
  "acceptTerms",
] as const;

// The reference also asks for a mobile number; the backend's RegisterRequest
// has no such field, so it is left out rather than collected and dropped.
const TEXT_FIELDS = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    placeholder: "e.g. Rohan Sharma",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "name@email.com",
    autoComplete: "email",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "••••••••",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "••••••••",
    autoComplete: "new-password",
  },
] as const;

/** Create Account. The backend emails a code, verified on the next screen. */
export default function SignUpScreen() {
  const { go } = useAuthNavigation();
  const mutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = ({ name, email, password }: RegisterFormValues) => {
    mutation.mutate(
      { name, email, password },
      { onSuccess: () => go(AUTH_ROUTES.verifyEmail, { email }) },
    );
  };

  const error = firstFieldError(errors, FIELD_ORDER) ?? mutation.error?.message;
  // Stays on the loader until the code screen takes over.
  const sending = mutation.isPending || mutation.isSuccess;

  return (
    <div className="font-funnel relative flex h-full w-full flex-1 flex-col overflow-hidden bg-transparent px-5 py-6 select-none">
      <AuthScreenHeader
        title="Create Account"
        onBack={() => go(AUTH_ROUTES.choice)}
        className="mb-4"
      />

      {sending ? (
        <PageLoader />
      ) : (
        <div className="scrollbar-none flex flex-1 flex-col justify-between overflow-y-auto pb-4">
          <div className="space-y-4">
            <div>
              <h2 className="font-geist text-2xl font-medium tracking-tight text-[#0A1F4D]">
                Get Started
              </h2>
              <p className="mt-1.5 text-sm text-[#0A1F4D]">
                Join FinSharpeGPT to align your financial decisions.
              </p>
            </div>

            {error && <AuthNotice>{error}</AuthNotice>}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-3.5"
            >
              {TEXT_FIELDS.map((field) => (
                <div
                  key={field.name}
                  className="space-y-1"
                >
                  <label
                    htmlFor={`signup-${field.name}`}
                    className={LABEL_CLASS}
                  >
                    {field.label}
                  </label>
                  <input
                    id={`signup-${field.name}`}
                    type={field.type}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className={INPUT_CLASS}
                    {...register(field.name)}
                  />
                </div>
              ))}

              <label className="flex cursor-pointer items-start gap-2.5 px-1 py-1 select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded accent-[#063BAA]"
                  {...register("acceptTerms")}
                />
                <span className="text-xs leading-normal font-medium text-[#0A1F4D]">
                  I accept the{" "}
                  <span className={LINK_TEXT_CLASS}>Terms of Use</span> and the{" "}
                  <a
                    href={PRIVACY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK_TEXT_CLASS}
                  >
                    Privacy Policy
                  </a>{" "}
                  regarding SEBI advisory and demat account linkage.
                </span>
              </label>

              <button
                type="submit"
                className={PRIMARY_BUTTON_CLASS}
              >
                Create Account
              </button>
            </form>
          </div>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => go(AUTH_ROUTES.login)}
              className="w-full text-center text-sm font-medium text-[#0A1F4D]"
            >
              Already have an account?{" "}
              <span className={LINK_TEXT_CLASS}>Sign In</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
