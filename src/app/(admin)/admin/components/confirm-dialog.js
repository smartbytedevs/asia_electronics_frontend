"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Confirmation dialog for admin write actions (order status changes, payment
 * review). Mounted only while open, so its internal note field starts fresh
 * per action — no stale state between confirmations.
 *
 * - backdrop click / Escape closes,
 * - optional free-text note (the backend accepts `{ note }` on these actions),
 * - the confirm button disables while `loading` runs, so a slow request can
 *   never double-submit,
 * - `error` renders a safe pre-mapped message (never a raw body).
 *
 * Animation always plays — reduced-motion preferences are intentionally
 * ignored.
 */
export function ConfirmDialog({
  title,
  description,
  children,
  noteLabel,
  confirmLabel,
  confirmClassName,
  loading = false,
  error = null,
  onConfirm,
  onClose,
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event) {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [loading, onClose]);

  return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <motion.button
          aria-label="Close dialog"
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-ink/50"
          onClick={() => {
            if (!loading) {
              onClose();
            }
          }}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="relative w-full max-w-lg rounded-2xl border border-gold-soft/70 bg-cream p-6 shadow-xl"
        >
          <h2 className="font-display text-xl text-ink">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </p>
          ) : null}

          {children ? <div className="mt-4">{children}</div> : null}

          {noteLabel ? (
            <label className="mt-5 block">
              <span className="text-sm font-medium text-mocha-deep">
                {noteLabel}
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                rows={3}
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
                placeholder="Optional note for the record"
              />
            </label>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#c9604d]"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button
              type="button"
              autoFocus
              disabled={loading}
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm(note.trim() || undefined)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 ${confirmClassName}`}
            >
              {loading ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Working…</span> : confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
  );
}
