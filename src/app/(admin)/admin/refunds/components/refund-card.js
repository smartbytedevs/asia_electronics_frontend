import Link from "next/link";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { paymentMethodLabel, refundStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { RefundActions } from "./refund-actions";

/**
 * Mobile refund card — the same serializer fields as the desktop table.
 */
export function RefundCard({ refund, onChanged }) {
  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/admin/refunds/${refund.id}`}
          className="font-medium tabular-nums text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
        >
          {refund.refundNumber}
        </Link>
        <StatusBadge meta={refundStatusMeta(refund.status)} />
      </div>

      <p className="mt-2 text-xl font-semibold tabular-nums text-ink">
        {formatMinorUnits(refund.amount)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {paymentMethodLabel(refund.paymentMethod)}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Return</dt>
          <dd className="text-ink">
            {refund.return ? (
              <Link
                href={`/admin/returns/${refund.return.id}`}
                className="underline-offset-2 hover:underline"
              >
                {refund.return.returnNumber || "View return"}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Order</dt>
          <dd className="text-ink">
            {refund.order ? (
              <Link
                href={`/admin/orders/${refund.order.id}`}
                className="underline-offset-2 hover:underline"
              >
                {refund.order.orderNumber || "View order"}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(refund.createdAt)}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-gold-soft/40 pt-3">
        <RefundActions refund={refund} onChanged={onChanged} />
      </div>
    </article>
  );
}
