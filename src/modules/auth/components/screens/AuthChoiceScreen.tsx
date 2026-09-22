"use client";

import Image from "next/image";
import { AUTH_ROUTES } from "../../constants/routes";
import {
  OUTLINE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "../../constants/styles";
import { useAuthNavigation } from "../../hooks/useAuthNavigation";
import { AuthScreenHeader } from "../shared/AuthScreenHeader";

/** "Get Started": create an account or sign in to an existing one. */
export default function AuthChoiceScreen() {
  const { go } = useAuthNavigation();

  return (
    <div className="font-funnel relative flex h-full w-full flex-1 flex-col justify-between overflow-hidden bg-transparent px-5 py-6 select-none">
      <AuthScreenHeader
        title="Secure Access"
        onBack={() => go(AUTH_ROUTES.welcome)}
      />

      <div className="relative z-10 my-auto flex flex-col items-center text-center">
        <div className="mb-3 flex justify-center">
          <Image
            src="/logo/Finsharpe Logo - Icon.svg"
            alt="FinSharpe"
            width={40}
            height={40}
            className="h-10 w-10"
          />
        </div>
        <h2 className="font-geist mb-2 text-xl font-medium tracking-tight text-[#0A1F4D]">
          Choose How to Proceed
        </h2>
        <p className="max-w-[310px] text-center text-sm leading-relaxed text-[#0A1F4D]">
          Link your portfolio securely to unlock personalized insights and
          AI-led analysis.
        </p>
      </div>

      <div className="relative z-10 w-full shrink-0 space-y-3 px-2 pb-8">
        <button
          type="button"
          onClick={() => go(AUTH_ROUTES.register)}
          className={PRIMARY_BUTTON_CLASS}
        >
          Create Account
        </button>
        <button
          type="button"
          onClick={() => go(AUTH_ROUTES.login)}
          className={OUTLINE_BUTTON_CLASS}
        >
          Sign In to Portfolio
        </button>
        <button
          type="button"
          onClick={() => go(AUTH_ROUTES.welcome)}
          className="mt-1 w-full py-2 text-sm font-medium text-[#0A1F4D] transition-colors hover:text-[#063BAA]"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
