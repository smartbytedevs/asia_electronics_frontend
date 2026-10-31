import Link from "next/link";
import { CreditCard, Eye } from "lucide-react";
import { formatDate, formatMinorUnits } from "@/lib/utils";
import { orderStatusMeta, paymentMethodLabel } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { OrderActions } from "./order-actions";
import { CourierStatus } from "./order-courier-status";
import {
  customerNameFor,
  customerPhoneFor,
  itemCountLabel,
  orderNumberFor,
  productSummaryFor,
  totalQuantityFor,
} from "./order-utils";

function CardField({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

/**
 * Mobile order card — the list transforms into readable cards instead of a
 * horizontally scrolling table. Shows the same real fields as the desktop
 * table plus a link to the full order.
 */
export function OrderCard({ order, onChanged, courier, onCourierRetry, payment }) {
  const phone = customerPhoneFor(order);
  const summary = productSummaryFor(order);
  const quantity = totalQuantityFor(order);

  return (
    <article className="group rounded-[22px] border border-gold-soft/70 bg-cream p-4 shadow-sm transition-colors hover:border-gold-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/orders/${order.id}`}
            className="font-semibold tabular-nums text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
          >
            {orderNumberFor(order)}
          </Link>
          <p className="mt-1 text-sm font-medium text-ink">{customerNameFor(order)}</p>
          {phone ? (
            <p className="mt-0.5 text-xs tabular-nums text-muted">{phone}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge meta={orderStatusMeta(order.status)} />
          <CourierStatus
            state={courier}
            onRetry={() => onCourierRetry?.(order.id)}
          />
        </div>
      </div>

      <p className="mt-3 truncate text-sm text-mocha-deep" title={summary}>
        {summary}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gold-soft/40 pt-3">
        <CardField label="Date">{formatDate(order.createdAt)}</CardField>
        <CardField label="Total">
          <span className="font-semibold tabular-nums">
            {formatMinorUnits(order.totals?.grandTotalMinorUnits)}
          </span>
        </CardField>
        <CardField label="Payment">
          <span className="inline-flex items-center gap-1.5">
            <CreditCard aria-hidden="true" className="h-3.5 w-3.5 text-muted/70" />
            {paymentMethodLabel(order.paymentMethod)}
          </span>
        </CardField>
        <CardField label="Items">
          {itemCountLabel(order)} · Qty {quantity || "—"}
        </CardField>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-gold-soft/40 pt-3">
        <OrderActions order={order} onChanged={onChanged} courier={courier} payment={payment} />
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30"
        >
          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
          View
        </Link>
      </div>
    </article>
  );
}
