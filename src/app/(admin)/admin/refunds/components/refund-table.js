import Link from "next/link";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { paymentMethodLabel, refundStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { RefundActions } from "./refund-actions";

/**
 * A human label for the serializer's user refs (safe user or { id }).
 * Never falls back to the technical user id — unidentifiable actors read as
 * "Staff".
 */
export function actorLabel(userRef) {
  if (!userRef) {
    return "—";
  }
  if (userRef.name) {
    return userRef.name;
  }
  if (userRef.email) {
    return userRef.email;
  }
  return "Staff";
}

/**
 * Desktop refund table. Columns map to the refund serializer: number, status,
 * return, order, amount, payment method, created, and process/void actions for
 * PENDING rows.
 */
export function RefundTable({ refunds, onChanged, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Refund</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Return</th>
              <th scope="col" className="px-4 py-3 font-medium">Order</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 font-medium">Method</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {refunds.map((refund) => (
              <tr key={refund.id} className="hover:bg-gold-soft/20">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/refunds/${refund.id}`}
                    className="font-medium tabular-nums text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                  >
                    {refund.refundNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge meta={refundStatusMeta(refund.status)} />
                </td>
                <td className="px-4 py-3">
                  {refund.return ? (
                    <Link
                      href={`/admin/returns/${refund.return.id}`}
                      className="text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                    >
                      {refund.return.returnNumber || "View return"}
                    </Link>
                  ) : (
                    <span className="text-muted/60">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {refund.order ? (
                    <Link
                      href={`/admin/orders/${refund.order.id}`}
                      className="text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                    >
                      {refund.order.orderNumber || "View order"}
                    </Link>
                  ) : (
                    <span className="text-muted/60">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                  {formatMinorUnits(refund.amount)}
                </td>
                <td className="px-4 py-3 text-muted">{paymentMethodLabel(refund.paymentMethod)}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(refund.createdAt)}</td>
                <td className="px-4 py-3">
                  <RefundActions refund={refund} onChanged={onChanged} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
