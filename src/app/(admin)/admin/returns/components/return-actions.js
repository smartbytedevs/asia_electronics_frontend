"use client";

import { useState } from "react";
import {
  approveReturn,
  rejectReturn,
  completeReturn,
  cancelReturn,
} from "@/lib/api/returns";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";

const ACTION_META = {
  approve: {
    title: "Approve return",
    description: (item) =>
      `Approve return ${item.returnNumber}. Completing it later restocks the items and creates the refund.`,
    confirmLabel: "Approve return",
    className: "bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold",
  },
  reject: {
    title: "Reject return",
    description: (item) =>
      `Reject return ${item.returnNumber}. This action is final and no refund will be created.`,
    confirmLabel: "Reject return",
    className:
      "bg-[#c9604d] text-white hover:bg-[#b35442] focus-visible:ring-[#c9604d]",
  },
  complete: {
    title: "Complete return",
    description: (item) =>
      `Complete return ${item.returnNumber}. Items are restocked and a PENDING refund is created in the same transaction. This action is final.`,
    confirmLabel: "Complete return",
    className: "bg-mocha text-white hover:bg-mocha-deep focus-visible:ring-mocha",
  },
  cancel: {
    title: "Cancel return",
    description: (item) =>
      `Cancel return ${item.returnNumber}. No restock or refund happens; an approved-but-uncompleted return has nothing to undo. This action is final.`,
    confirmLabel: "Cancel return",
    className: "bg-stone-500 text-white hover:bg-stone-600 focus-visible:ring-stone-500",
  },
};

const SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

/**
 * Return moderation actions, driven by the return state machine
 * (return.constants.js):
 *   PENDING  → approve, reject, cancel
 *   APPROVED → complete (restock + refund), cancel
 *   REJECTED / COMPLETED / CANCELLED → terminal, no actions
 *
 * Every action accepts an optional `note` recorded by the backend. A
 * confirmation dialog guards each decision; on success the caller refreshes.
 */
export function ReturnActions({ returnItem, onChanged }) {
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const actions = [];
  if (returnItem.status === "PENDING") {
    actions.push("approve", "reject", "cancel");
  } else if (returnItem.status === "APPROVED") {
    actions.push("complete", "cancel");
  }

  if (actions.length === 0) {
    return <span className="text-xs text-muted/60">—</span>;
  }

  const calls = {
    approve: approveReturn,
    reject: rejectReturn,
    complete: completeReturn,
    cancel: cancelReturn,
  };

  async function run(action, note) {
    setLoading(true);
    setError(null);
    const result = await calls[action](returnItem.id, note);
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
        {actions.includes("approve") ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setDialog("approve");
            }}
            className={`${SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
          >
            Approve
          </button>
        ) : null}
        {actions.includes("reject") ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setDialog("reject");
            }}
            className={`${SMALL_BUTTON} border-[#c9604d]/40 text-[#c9604d] hover:bg-red-50`}
          >
            Reject
          </button>
        ) : null}
        {actions.includes("complete") ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setDialog("complete");
            }}
            className={`${SMALL_BUTTON} border-gold-soft bg-mocha text-white hover:bg-mocha-deep`}
          >
            Complete
          </button>
        ) : null}
        {actions.includes("cancel") ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setDialog("cancel");
            }}
            className={`${SMALL_BUTTON} border-stone-300 text-stone-600 hover:bg-stone-100`}
          >
            Cancel
          </button>
        ) : null}
      </div>

      {dialog ? (
        <ConfirmDialog
          title={ACTION_META[dialog].title}
          description={ACTION_META[dialog].description(returnItem)}
          noteLabel="Review note (optional)"
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
