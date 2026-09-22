"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GradientBackground from "../shared/GradientBackground";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-gradient-from via-brand-gradient-via to-brand-gradient-to px-4 sm:px-6 lg:px-8">
      <GradientBackground />

      <div className="relative z-10 mx-auto max-w-4xl py-32 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div custom={0} variants={fadeUp}>
            <Badge className="rounded-full border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">
              AI-Powered Financial Intelligence
            </Badge>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-4xl font-bold tracking-tight text-primary-main-dark sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your Intelligent{" "}
            <span className="bg-gradient-to-r from-blue-600 to-brand-teal bg-clip-text text-transparent">
              Financial
            </span>{" "}
            Companion
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="mx-auto max-w-2xl text-lg text-text-secondary sm:text-xl"
          >
            Bring your holdings in through the RBI-regulated Account
            Aggregator, then ask about them in plain language — screen the
            market, read what the filings say, and get a research report back.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            className="flex flex-col gap-3 sm:flex-row sm:gap-4"
          >
            <Button asChild size="lg" className="gap-2 text-base">
              <Link href="/">
                Start Chatting
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base"
            >
              <a href="#features">Explore Features</a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
