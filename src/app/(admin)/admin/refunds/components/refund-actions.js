"use client";

import { useState } from "react";
import { processRefund, voidRefund } from "@/lib/api/refunds";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";

const ACTION_META = {
  process: {
    title: "Process refund",
    description: (refund) =>
      `Payout refund ${refund.refundNumber}. The linked return must be completed. This action is final.`,
    confirmLabel: "Process refund",
    className: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600",
  },
  void: {
    title: "Void refund",
    description: (refund) =>
      `Void refund ${refund.refundNumber}. The payout is cancelled and the refund record is closed. This action is final.`,
    confirmLabel: "Void refund",
    className:
      "bg-[#c9604d] text-white hover:bg-[#b35442] focus-visible:ring-[#c9604d]",
  },
};

const SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

/**
 * Refund payout actions, driven by the refund state machine
 * (refund.constants.js):
 *   PENDING → process (requires linked return COMPLETED), void
 *   PROCESSED / VOIDED → terminal, no actions
 *
 * Both actions accept an optional `note` recorded by the backend. A
 * confirmation dialog guards each decision; on success the caller refreshes.
 */
export function RefundActions({ refund, onChanged }) {
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (refund.status !== "PENDING") {
    return <span className="text-xs text-muted/60">—</span>;
  }

  const calls = {
    process: processRefund,
    void: voidRefund,
  };

  async function run(action, note) {
    setLoading(true);
    setError(null);
    const result = await calls[action](refund.id, note);
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
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDialog("process");
          }}
          className={`${SMALL_BUTTON} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
        >
          Process
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDialog("void");
          }}
          className={`${SMALL_BUTTON} border-[#c9604d]/40 text-[#c9604d] hover:bg-red-50`}
        >
          Void
        </button>
      </div>

      {dialog ? (
        <ConfirmDialog
          title={ACTION_META[dialog].title}
          description={ACTION_META[dialog].description(refund)}
          noteLabel="Payout note (optional)"
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
