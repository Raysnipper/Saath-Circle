"use client";

import { motion, Variants } from "framer-motion";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function LandingHero() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center text-center relative z-10">
      {/* Background glow breathing animation */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-amber-600/10 blur-[100px] -z-10 pointer-events-none"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative max-w-5xl space-y-5 rounded-[2.5rem] border border-white/60 bg-white/65 px-8 py-12 sm:px-12 sm:py-14 shadow-[0_24px_80px_rgba(93,72,52,0.12)] backdrop-blur-md"
      >
        <motion.h1
          variants={item}
          className="font-brand text-[4rem] font-semibold leading-[0.95] tracking-tight text-foreground sm:text-[5.5rem] md:text-[6.5rem]"
        >
          Shared balances,<br />held with care.
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:text-2xl lg:leading-relaxed"
        >
          A private place to keep shared balances clear and comfortable,
          without turning personal money into awkward conversation.
        </motion.p>

        <motion.div variants={item} className="pt-2">
          <Button
            size="lg"
            className="h-12 px-8 rounded-full text-base font-semibold shadow-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => signIn("google", undefined, { prompt: "select_account" })}
          >
            Get Started with Google
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
