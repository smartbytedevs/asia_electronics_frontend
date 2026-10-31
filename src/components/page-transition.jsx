"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

/**
 * PageTransition
 *
 * A soft fade-and-rise that plays the destination page in whenever the route
 * changes. Wraps the page slot inside the storefront and admin layouts only
 * (never the root layout, so persistent chrome like the header and sidebar
 * stays put). Keyed by pathname so AnimatePresence waits for the outgoing
 * page to fade out before the incoming page slides up in.
 *
 * While a new route is streaming, the StoreLoader renders above it, so this
 * reveal is what greets the visitor as the loader gives way to the page —
 * a smooth hand-off from the loading state into content.
 *
 * Reduced-motion preferences are intentionally ignored: the motion always
 * plays the same on every device.
 */
export function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
