"use client";

import { AuthBackground } from "@/modules/auth/components/AuthBackground";
import { AnimatedLogoPulse } from "@/modules/auth/components/AnimatedLogoPulse";
import { LogoFlight } from "@/modules/auth/components/LogoFlight";
import { motion } from "framer-motion";
import { Shield, Zap, TrendingUp } from "lucide-react";

const trustSignals = [
  { icon: Shield, label: "Bank-grade security" },
  { icon: Zap, label: "AI-powered insights" },
  { icon: TrendingUp, label: "Trusted by investors" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark relative min-h-screen">
      <AuthBackground />
      <div className="hidden lg:block">
        <LogoFlight />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left panel — Desktop visual showcase */}
        <div className="hidden lg:flex lg:w-[55%] xl:w-[58%] flex-col items-center justify-center px-12 relative">
          <motion.div
            className="flex flex-col items-center gap-8 max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <AnimatedLogoPulse size={160} />

            <motion.div
              className="flex flex-col items-center gap-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-white leading-none">
                Fin
                <span className="bg-gradient-to-r from-[#00a2ff] to-[#45e3d7] bg-clip-text text-transparent">
                  Sharpe
                </span>
              </h1>
              <p className="text-lg text-white/40 max-w-xs leading-relaxed">
                The future of intelligent investing
              </p>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center gap-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
            >
              {trustSignals.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-white/20"
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium tracking-wide uppercase">
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Vertical divider — Desktop only */}
        <div className="hidden lg:block w-px self-stretch">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Right panel — Form area */}
        <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
          {/* Mobile branding */}
          <motion.div
            className="lg:hidden mb-8 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <AnimatedLogoPulse size={80} />
            <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
              Fin
              <span className="bg-gradient-to-r from-[#00a2ff] to-[#45e3d7] bg-clip-text text-transparent">
                Sharpe
              </span>
            </h1>
          </motion.div>

          {/* Form wrapper with entrance animation */}
          <motion.div
            className="w-full max-w-[420px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
