import Link from "next/link";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { paymentStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { PaymentActions } from "./payment-actions";

function decisionFor(payment) {
  if (payment.status === "VERIFIED") {
    return `Verified ${formatDateTime(payment.verifiedAt)}`;
  }
  if (payment.status === "REJECTED") {
    return `Rejected ${formatDateTime(payment.rejectedAt)}`;
  }
  return "Awaiting review";
}

/**
 * Mobile payment card — the same real fields as the desktop table, laid out
 * for small screens.
 */
export function PaymentCard({ payment, onChanged }) {
  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">
            <Link
              href={`/admin/orders/${payment.orderId}`}
              className="text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
            >
              View order
            </Link>
          </p>
          <p className="mt-0.5 font-semibold tabular-nums text-ink">
            {formatMinorUnits(payment.submittedAmountMinorUnits)}
          </p>
        </div>
        <StatusBadge meta={paymentStatusMeta(payment.status)} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Method</dt>
          <dd className="text-ink">{payment.paymentMethod?.displayName || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Submitted</dt>
          <dd className="text-ink">{formatDateTime(payment.createdAt)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">Transaction ref</dt>
          <dd className="text-ink">{payment.transactionReference || "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">Decision</dt>
          <dd className="text-ink">{decisionFor(payment)}</dd>
        </div>
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

      <div className="mt-3 border-t border-gold-soft/40 pt-3">
        <PaymentActions payment={payment} onChanged={onChanged} />
      </div>
    </article>
  );
}
