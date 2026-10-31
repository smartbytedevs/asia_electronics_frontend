import Link from "next/link";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { returnStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { ReturnActions } from "./return-actions";

function itemSummary(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "—";
  }
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const first = items[0];
  const name = first.productName || first.sku || "Item";
  return items.length === 1
    ? `${name} × ${totalQuantity}`
    : `${name} +${items.length - 1} more · ${totalQuantity} items`;
}

/**
 * Desktop return table. Columns map to the admin return serializer: number,
 * status, order, items, reason, requested, and state-machine-driven actions.
 */
export function ReturnTable({ returns, onChanged, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Return</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Order</th>
              <th scope="col" className="px-4 py-3 font-medium">Items</th>
              <th scope="col" className="px-4 py-3 font-medium">Reason</th>
              <th scope="col" className="px-4 py-3 font-medium">Requested</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {returns.map((item) => (
              <tr key={item.id} className="hover:bg-gold-soft/20">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/returns/${item.id}`}
                    className="font-medium tabular-nums text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                  >
                    {item.returnNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge meta={returnStatusMeta(item.status)} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${item.orderId}`}
                    className="text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                  >
                    View order
                  </Link>
                </td>
                <td className="px-4 py-3 text-mocha-deep">{itemSummary(item.items)}</td>
                <td className="px-4 py-3">
                  <p className="max-w-[220px] truncate text-muted" title={item.reason}>
                    {item.reason}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted">{formatDateTime(item.createdAt)}</td>
                <td className="px-4 py-3">
                  <ReturnActions returnItem={item} onChanged={onChanged} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
