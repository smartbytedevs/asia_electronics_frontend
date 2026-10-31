"use client";

import { useState } from "react";
import { retryDispatch, cancelShipment } from "@/lib/api/courier-shipments";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";

const ACTION_META = {
  retry: {
    title: "Retry dispatch",
    description:
      "Re-submit this shipment to the courier provider. The delivery payload is rebuilt from the current order.",
    confirmLabel: "Retry dispatch",
    className: "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-600",
  },
  cancel: {
    title: "Cancel shipment",
    description:
      "Cancel this courier shipment. Pending or failed dispatches are cancelled locally; active shipments are cancelled with the provider.",
    confirmLabel: "Cancel shipment",
    className:
      "bg-[#c9604d] text-white hover:bg-[#b35442] focus-visible:ring-[#c9604d]",
  },
};

const SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

/**
 * Courier shipment actions, driven by the courier state machine
 * (courier.constants.js):
 *   FAILED   → retry dispatch
 *   PENDING / FAILED / ACTIVE / CANCELLATION_FAILED → cancel
 *   DELIVERED / CANCELLED (terminal) → no actions
 *
 * Retry accepts an optional note (the backend records it); cancel takes no
 * body. A confirmation dialog guards each decision. On success the caller
 * refreshes so the list/detail reflects the new status.
 */
export function ShipmentActions({ shipment, onChanged }) {
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const actions = [];
  if (shipment.status === "FAILED") {
    actions.push("retry");
  }
  if (
    shipment.status === "PENDING" ||
    shipment.status === "FAILED" ||
    shipment.status === "ACTIVE" ||
    shipment.status === "CANCELLATION_FAILED"
  ) {
    actions.push("cancel");
  }

  if (actions.length === 0) {
    return <span className="text-xs text-muted/60">—</span>;
  }

  const calls = {
    retry: retryDispatch,
    cancel: cancelShipment,
  };

  async function run(action, note) {
    setLoading(true);
    setError(null);
    const result = await calls[action](shipment.id, note);
    setLoading(false);
    if (result.ok) {
      setDialog(null);
      onChanged();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {actions.includes("retry") ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setDialog("retry");
            }}
            className={`${SMALL_BUTTON} border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100`}
          >
            Retry
          </button>
        ) : null}
        {actions.includes("cancel") ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setDialog("cancel");
            }}
            className={`${SMALL_BUTTON} border-[#c9604d]/40 text-[#c9604d] hover:bg-red-50`}
          >
            Cancel
          </button>
        ) : null}
      </div>

      {dialog ? (
        <ConfirmDialog
          title={ACTION_META[dialog].title}
          description={ACTION_META[dialog].description}
          noteLabel={dialog === "retry" ? "Note (optional)" : undefined}
          confirmLabel={ACTION_META[dialog].confirmLabel}
          confirmClassName={ACTION_META[dialog].className}
          loading={loading}
          error={error}
          onConfirm={(note) => run(dialog, note)}
          onClose={() => {
            if (!loading) {
              setDialog(null);
              setError(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
