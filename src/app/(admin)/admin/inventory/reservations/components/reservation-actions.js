"use client";

import { useState } from "react";
import {
  consumeReservation,
  expireReservation,
  releaseReservation,
} from "@/lib/api/reservations";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../../components/confirm-dialog";

const SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

const ACTION_META = {
  release: {
    title: "Release reservation",
    description:
      "Return the reserved quantity to availability. Idempotent — releasing an already-released reservation is a no-op.",
    confirmLabel: "Release reservation",
    className: "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-600",
  },
  consume: {
    title: "Consume reservation",
    description:
      "Move the reserved quantity physically out of ONLINE. Idempotent — consuming an already-consumed reservation is a no-op.",
    confirmLabel: "Consume reservation",
    className: "bg-mocha text-white hover:bg-mocha-deep focus-visible:ring-gold",
  },
  expire: {
    title: "Expire reservation",
    description:
      "Mark the reservation expired and release its quantity back to availability.",
    confirmLabel: "Expire reservation",
    className:
      "bg-stone-600 text-white hover:bg-stone-700 focus-visible:ring-stone-600",
  },
};

const CALLS = {
  release: releaseReservation,
  consume: consumeReservation,
  expire: expireReservation,
};

/**
 * Reservation lifecycle commands. Only ACTIVE reservations get actions —
 * RELEASED/CONSUMED/EXPIRED are terminal. Each action is a confirm dialog
 * (no body; the backend derives the actor from the session). Success refreshes
 * the caller. `subjectName` / `variantLabel` come from the enriched parent row
 * so the dialog shows a human-readable subject, never a raw ID.
 */
export function ReservationActions({
  reservation,
  subjectName,
  variantLabel,
  onChanged,
  className,
}) {
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (reservation.status !== "ACTIVE") {
    return <span className="text-xs text-muted/60">—</span>;
  }

  const meta = ACTION_META[action] ?? null;

  async function run() {
    setLoading(true);
    setError(null);
    const result = await CALLS[action](reservation.id);
    setLoading(false);
    if (result.ok) {
      setAction(null);
      onChanged();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <>
      <div className={`flex flex-wrap items-center justify-end gap-2 ${className ?? ""}`}>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAction("release");
          }}
          className={`${SMALL_BUTTON} border-sky-200 bg-white text-sky-700 hover:bg-sky-50`}
        >
          Release
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAction("consume");
          }}
          className={`${SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
        >
          Consume
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAction("expire");
          }}
          className={`${SMALL_BUTTON} border-stone-200 bg-white text-stone-600 hover:bg-stone-100`}
        >
          Expire
        </button>
      </div>

      {action ? (
        <ConfirmDialog
          key={action}
          title={meta.title}
          description={meta.description}
          confirmLabel={meta.confirmLabel}
          confirmClassName={meta.className}
          loading={loading}
          error={error}
          onConfirm={() => run()}
          onClose={() => {
            if (!loading) {
              setAction(null);
              setError(null);
            }
          }}
        >
          <dl className="rounded-xl border border-gold-soft/70 bg-sand/50 p-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <dt className="text-xs text-muted">Variant</dt>
              <dd className="text-right text-sm font-medium text-ink">
                {variantLabel
                  ? `${subjectName ?? "Product"} · ${variantLabel}`
                  : subjectName ?? "Product"}
              </dd>
              <dt className="text-xs text-muted">Quantity</dt>
              <dd className="text-right text-sm font-medium tabular-nums text-ink">
                {reservation.quantity}
              </dd>
              <dt className="text-xs text-muted">Reference</dt>
              <dd className="text-right text-sm font-medium text-ink">
                {reservation.reference?.kind === "order"
                  ? `${reservation.reference.orderName || reservation.reference.fallback}${
                      reservation.reference.customerName
                        ? ` · ${reservation.reference.customerName}`
                        : ""
                    }`
                  : `${reservation.referenceType} · ${reservation.referenceId}`}
              </dd>
            </div>
          </dl>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
