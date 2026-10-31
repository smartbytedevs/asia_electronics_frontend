import Link from "next/link";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import {
  paymentStatusMeta,
} from "../../components/status-meta";
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

function proofLink(payment) {
  if (payment.proof?.secureUrl) {
    return (
      <a
        href={payment.proof.secureUrl}
        target="_blank"
        rel="noreferrer"
        className="text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
      >
        View proof
      </a>
    );
  }
  return null;
}

/**
 * Desktop payment table. Columns map to the payment serializer fields:
 * status, orderId, submittedAmountMinorUnits, paymentMethod.displayName,
 * transactionReference, createdAt, decision timestamps, and the verify/reject
 * actions for SUBMITTED rows.
 */
export function PaymentTable({ payments, onChanged, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Order</th>
              <th scope="col" className="px-4 py-3 font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 font-medium">Method</th>
              <th scope="col" className="px-4 py-3 font-medium">Transaction ref</th>
              <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
              <th scope="col" className="px-4 py-3 font-medium">Decision</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gold-soft/20">
                <td className="px-4 py-3">
                  <StatusBadge meta={paymentStatusMeta(payment.status)} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${payment.orderId}`}
                    className="font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                  >
                    View order
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums text-ink">
                  {formatMinorUnits(payment.submittedAmountMinorUnits)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {payment.paymentMethod?.displayName || "—"}
                </td>
                <td className="px-4 py-3">
                  <p className="text-mocha-deep">
                    {payment.transactionReference || "—"}
                  </p>
                  {proofLink(payment)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDateTime(payment.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted">{decisionFor(payment)}</td>
                <td className="px-4 py-3">
                  <PaymentActions payment={payment} onChanged={onChanged} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
