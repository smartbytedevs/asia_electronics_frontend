import Link from "next/link";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { courierStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { ShipmentActions } from "./shipment-actions";

/**
 * Mobile courier shipment card — the same serializer fields as the desktop
 * table, laid out for small screens.
 */
export function CourierCard({ shipment, onChanged }) {
  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/admin/orders/${shipment.orderId}`}
            className="font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
          >
            {shipment.orderNumber || "Order"}
          </Link>
          <p className="mt-1 text-xs text-muted">
            {shipment.provider || "—"}
            {shipment.consignmentId ? ` · ${shipment.consignmentId}` : ""}
          </p>
        </div>
        <StatusBadge meta={courierStatusMeta(shipment.status)} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Consignment</dt>
          <dd className="tabular-nums text-ink">
            {shipment.consignmentId ? (
              <Link
                href={`/admin/courier/${shipment.id}`}
                className="underline-offset-2 hover:underline"
              >
                {shipment.consignmentId}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Amount to collect</dt>
          <dd className="font-semibold tabular-nums text-ink">
            {formatMinorUnits(shipment.amountToCollectMinorUnits)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">Submitted</dt>
          <dd className="text-ink">
            {shipment.submission?.submittedAt
              ? formatDateTime(shipment.submission.submittedAt)
              : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-gold-soft/40 pt-3">
        <ShipmentActions shipment={shipment} onChanged={onChanged} />
      </div>
    </article>
  );
}
