"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Scroll-triggered reveal wrapper for storefront sections. Fades and rises the
 * children into view once. Reduced-motion preferences are intentionally
 * ignored so the reveal plays on every device.
 */
export function Reveal({ children, className = "", delay = 0, y = 24 }) {
  return (
      <motion.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay, ease: EASE }}
        className={className}
      >
        {children}
      </motion.div>
  );
}
