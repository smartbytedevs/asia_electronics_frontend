"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Primary submit button for the auth forms. Disabled (and shows a spinner)
 * while the request is in flight, so duplicate submissions are impossible.
 *
 * Motion is used only for interaction-driven micro-animation (hover/tap),
 * which never affects server-rendered markup, so it is hydration-safe.
 */
export function AuthSubmit({ children, submitting, submittingLabel, className }) {
  return (
    <motion.button
      type="submit"
      disabled={submitting}
      whileHover={submitting ? undefined : { y: -1 }}
      whileTap={submitting ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-mocha px-6 text-sm font-semibold text-white",
        "transition-colors duration-200 hover:bg-mocha-deep",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      {submitting ? <Spinner /> : null}
      <span>{submitting ? submittingLabel : children}</span>
    </motion.button>
  );
}
