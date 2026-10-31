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

const viewButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1";

export function OrderTable({ orders, onChanged, courierById, onCourierRetry, paymentById, className }) {
  return (
    <div className={`overflow-hidden rounded-[22px] border border-gold-soft/70 bg-cream shadow-sm ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1140px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Courier</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {orders.map((order) => {
              const phone = customerPhoneFor(order);
              const summary = productSummaryFor(order);
              const quantity = totalQuantityFor(order);
              const courier = courierById?.[order.id];
              const payment = paymentById?.[order.id];
              return (
                <tr key={order.id} className="transition-colors hover:bg-gold-soft/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-semibold tabular-nums text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                    >
                      {orderNumberFor(order)}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">{itemCountLabel(order)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{customerNameFor(order)}</p>
                    {phone ? (
                      <p className="mt-0.5 text-xs tabular-nums text-muted">{phone}</p>
                    ) : null}
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate text-mocha-deep" title={summary}>{summary}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">{quantity || "—"}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-ink">
                    {formatMinorUnits(order.totals?.grandTotalMinorUnits)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-mocha-deep">
                      <CreditCard aria-hidden="true" className="h-3.5 w-3.5 text-muted/70" />
                      {paymentMethodLabel(order.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge meta={orderStatusMeta(order.status)} />
                  </td>
                  <td className="px-4 py-3">
                    <CourierStatus
                      state={courier}
                      onRetry={() => onCourierRetry?.(order.id)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <OrderActions order={order} onChanged={onChanged} courier={courier} payment={payment} />
                      <Link
                        href={`/admin/orders/${order.id}`}
                        aria-label={`View order ${orderNumberFor(order)}`}
                        className={viewButtonClass}
                      >
                        <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
