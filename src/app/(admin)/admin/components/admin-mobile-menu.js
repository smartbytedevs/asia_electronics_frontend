"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AdminNavContext } from "./admin-nav-context";

/**
 * Mobile-only admin menu: a toggle button in the header that opens the admin
 * sidebar in a slide-over drawer below `lg`. It provides a close handler via
 * AdminNavContext so clicking any nav link inside the drawer closes it. The
 * header must not use `backdrop-filter` (a containing block for fixed
 * descendants), so this drawer stays viewport-fixed.
 */
export function AdminMobileMenu({ children }) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <AdminNavContext.Provider value={close}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        aria-label={open ? "Close admin menu" : "Open admin menu"}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="admin-mobile-drawer"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gold-soft bg-white px-3 text-sm font-semibold text-mocha-deep shadow-sm transition-colors hover:border-gold/50 hover:bg-gold-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 lg:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="h-4 w-4"
        >
          {open ? (
            <>
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </>
          ) : (
            <>
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </>
          )}
        </svg>
        <span>{open ? "Close" : "Menu"}</span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <div
            id="admin-mobile-drawer"
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-ink/40"
              onClick={close}
            />
            <motion.div
              initial={{ x: -272 }}
              animate={{ x: 0 }}
              exit={{ x: -272 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="absolute inset-y-0 left-0 w-64"
            >
              {children}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </AdminNavContext.Provider>
  );
}
