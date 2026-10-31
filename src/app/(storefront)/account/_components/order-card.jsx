import Link from "next/link";
import { formatDate, formatMinorUnits } from "@/lib/utils";
import {
  orderStatusMeta,
} from "@/app/(admin)/admin/components/status-meta";
import { StatusBadge } from "@/app/(admin)/admin/components/status-badge";
import { ArrowRightIcon } from "../../_components/icons";

function shortId(id) {
  return typeof id === "string" ? id.slice(0, 8) : "—";
}

/**
 * Compact customer order row: order number, placed date, item count, status
 * badge and grand total, linking to the order detail page. Pure presentational
 * so it renders in both the server overview and the client orders list.
 */
export function OrderCard({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sand bg-white p-5 transition-colors hover:border-gold-soft/80 hover:bg-sand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:p-6"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-display text-lg text-ink">
            {order.orderNumber || shortId(order.id)}
          </p>
          <StatusBadge meta={orderStatusMeta(order.status)} />
        </div>
        <p className="mt-1 text-sm text-muted">
          Placed {formatDate(order.createdAt)} · {itemCount} item
          {itemCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-display text-lg tabular-nums text-ink">
          {formatMinorUnits(order.totals?.grandTotalMinorUnits)}
        </p>
        <ArrowRightIcon className="h-4 w-4 text-mocha" />
      </div>
    </Link>
  );
}
