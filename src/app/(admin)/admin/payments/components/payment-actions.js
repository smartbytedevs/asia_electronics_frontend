"use client";

import Link from "next/link";
import { useState } from "react";
import { verifyPayment, rejectPayment } from "@/lib/api/payments";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { ConfirmDialog } from "../../components/confirm-dialog";

const ACTION_META = {
  verify: {
    title: "Verify payment",
    description:
      "Verify this payment. Once verified it counts toward sales and cannot be changed.",
    confirmLabel: "Verify payment",
    className: "bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold",
  },
  reject: {
    title: "Reject payment",
    description:
      "Reject this payment. The customer will be able to resubmit with a corrected proof.",
    confirmLabel: "Reject payment",
    className:
      "bg-[#c9604d] text-white hover:bg-[#b35442] focus-visible:ring-[#c9604d]",
  },
};

const SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

function ReviewRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function ReviewDetails({ payment }) {
  return (
    <div className="rounded-xl border border-gold-soft/70 bg-sand/50 p-4">
      <dl className="space-y-2">
        <ReviewRow label="Order">
          <Link
            href={`/admin/orders/${payment.orderId}`}
            className="underline-offset-2 hover:underline"
          >
            View order
          </Link>
        </ReviewRow>
        <ReviewRow label="Method">
          {payment.paymentMethod?.displayName || "—"}
        </ReviewRow>
        <ReviewRow label="Transaction ref">
          {payment.transactionReference || "—"}
        </ReviewRow>
        <ReviewRow label="Submitted amount">
          {formatMinorUnits(payment.submittedAmountMinorUnits)}
        </ReviewRow>
        <ReviewRow label="Expected amount">
          {formatMinorUnits(payment.expectedAmountMinorUnits)}
        </ReviewRow>
        <ReviewRow label="Submitted">
          {formatDateTime(payment.createdAt)}
        </ReviewRow>
      </dl>
      {payment.proof?.secureUrl ? (
        <a
          href={payment.proof.secureUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
        >
          View payment proof
        </a>
      ) : null}
    </div>
  );
}

/**
 * Payment review workflow. Only SUBMITTED payments get actions — VERIFIED is
 * terminal and REJECTED waits for a customer resubmission. Verify and reject
 * both support the backend's optional `{ note }`. The review dialog shows the
 * full payment record (amounts, method, transaction reference, timestamps,
 * proof) so the decision is informed. On success the caller refreshes.
 */
export function PaymentActions({ payment, onChanged }) {
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (payment.status !== "SUBMITTED") {
    return <span className="text-xs text-muted/60">—</span>;
  }

  const calls = {
    verify: verifyPayment,
    reject: rejectPayment,
  };

  async function run(action, note) {
    setLoading(true);
    setError(null);
    const result = await calls[action](payment.id, note);
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
            setDialog("verify");
          }}
          className={`${SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
        >
          Verify
        </button>
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
      </div>

      {dialog ? (
        <ConfirmDialog
          title={ACTION_META[dialog].title}
          description={ACTION_META[dialog].description}
          noteLabel="Note (optional)"
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
        >
          <ReviewDetails payment={payment} />
        </ConfirmDialog>
      ) : null}
    </>
  );
}
