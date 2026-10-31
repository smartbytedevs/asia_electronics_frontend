import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { returnStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { ReturnActions } from "./return-actions";

/**
 * Mobile return card — the same serializer fields as the desktop table.
 */
export function ReturnCard({ returnItem, onChanged }) {
  const items = Array.isArray(returnItem.items) ? returnItem.items : [];
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/admin/returns/${returnItem.id}`}
          className="font-medium tabular-nums text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
        >
          {returnItem.returnNumber}
        </Link>
        <StatusBadge meta={returnStatusMeta(returnItem.status)} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Order</dt>
          <dd className="text-ink">
            <Link
              href={`/admin/orders/${returnItem.orderId}`}
              className="underline-offset-2 hover:underline"
            >
              View order
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Items</dt>
          <dd className="text-ink">{totalQuantity}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">Reason</dt>
          <dd className="text-mocha-deep">{returnItem.reason}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">Requested</dt>
          <dd className="text-ink">{formatDateTime(returnItem.createdAt)}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-gold-soft/40 pt-3">
        <ReturnActions returnItem={returnItem} onChanged={onChanged} />
      </div>
    </article>
  );
}
