import Link from "next/link";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { courierStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { ShipmentActions } from "./shipment-actions";

/**
 * Desktop courier shipment table. Columns map to the admin shipment
 * serializer: status, order, consignment, provider, amount to collect,
 * submitted, and actions (retry/cancel) for the applicable states.
 */
export function CourierTable({ shipments, onChanged, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Order</th>
              <th scope="col" className="px-4 py-3 font-medium">Consignment</th>
              <th scope="col" className="px-4 py-3 font-medium">Provider</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Amount to collect</th>
              <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="hover:bg-gold-soft/20">
                <td className="px-4 py-3">
                  <StatusBadge meta={courierStatusMeta(shipment.status)} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${shipment.orderId}`}
                    className="font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                  >
                    {shipment.orderNumber || "Order"}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {shipment.consignmentId ? (
                    <Link
                      href={`/admin/courier/${shipment.id}`}
                      className="font-medium tabular-nums text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                    >
                      {shipment.consignmentId}
                    </Link>
                  ) : (
                    <span className="text-muted/60">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{shipment.provider || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                  {formatMinorUnits(shipment.amountToCollectMinorUnits)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDateTime(shipment.submission?.submittedAt)}
                </td>
                <td className="px-4 py-3">
                  <ShipmentActions shipment={shipment} onChanged={onChanged} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
