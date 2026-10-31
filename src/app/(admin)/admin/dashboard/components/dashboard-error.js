import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Safe error state for the analytics dashboard. Only the pre-mapped,
 * user-facing `message` (from `safeMessage`) is rendered — never raw backend
 * bodies, tokens, cookies, or stack traces. A retry button refetches.
 */
export function DashboardError({ message, onRetry }) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
    >
      <h2 className="font-display text-lg text-ink">Dashboard unavailable</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </motion.div>
  );
}
