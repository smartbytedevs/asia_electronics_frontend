import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { reservationStatusMeta } from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { ReservationActions } from "./reservation-actions";

function resolvedText(reservation) {
  if (reservation.status === "RELEASED") {
    return `Released ${formatDateTime(reservation.resolvedAt)}`;
  }
  if (reservation.status === "CONSUMED") {
    return `Consumed ${formatDateTime(reservation.resolvedAt)}`;
  }
  if (reservation.status === "EXPIRED") {
    return `Expired ${formatDateTime(reservation.resolvedAt)}`;
  }
  return "—";
}

function ReferenceCell({ reservation }) {
  const meta = reservation.reference;
  if (meta?.kind === "order") {
    return (
      <>
        <Link
          href={`/admin/orders/${encodeURIComponent(meta.orderId)}`}
          className="font-medium text-mocha-deep transition-colors hover:text-ink hover:underline"
        >
          {meta.orderName || "Order"}
        </Link>
        {meta.customerName ? (
          meta.customerId ? (
            <Link
              href={`/admin/customers/${encodeURIComponent(meta.customerId)}`}
              className="block max-w-[220px] truncate text-xs text-muted transition-colors hover:text-mocha-deep hover:underline"
            >
              {meta.customerName}
            </Link>
          ) : (
            <p className="max-w-[220px] truncate text-xs text-muted">
              {meta.customerName}
            </p>
          )
        ) : (
          <p className="max-w-[220px] truncate text-xs text-muted">
            {meta.fallback}
          </p>
        )}
      </>
    );
  }
  return (
    <>
      <p className="text-mocha-deep">{meta.referenceType}</p>
      <p className="max-w-[220px] truncate text-xs text-muted">
        {meta.referenceId}
      </p>
    </>
  );
}

/**
 * Desktop reservation table. Reservations arrive already grouped per product —
 * each group renders a header row (product name + totals) above its
 * reservations. Columns map to the reservation serializer fields: status,
 * variant, quantity, reference, expiry, created, resolved and the lifecycle
 * actions for ACTIVE rows. Rows are enriched with human-readable labels by the
 * parent, so no raw IDs are shown.
 */
export function ReservationTable({ groups, onChanged, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Variant</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Quantity</th>
              <th scope="col" className="px-4 py-3 font-medium">Reference</th>
              <th scope="col" className="px-4 py-3 font-medium">Expires</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
              <th scope="col" className="px-4 py-3 font-medium">Resolved</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {groups.map((group) => (
              <GroupRows key={group.key} group={group} onChanged={onChanged} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRows({ group, onChanged }) {
  return (
    <>
      <tr className="bg-sand/60">
        <td colSpan={8} className="px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-mocha-deep">
              {group.productNameLabel}
            </p>
            <p className="text-xs text-muted">
              {group.reservations.length}{" "}
              {group.reservations.length === 1 ? "reservation" : "reservations"}
              {" · "}
              {group.totalQuantity} unit{group.totalQuantity === 1 ? "" : "s"}
            </p>
          </div>
        </td>
      </tr>
      {group.reservations.map((reservation) => (
        <tr key={reservation.id} className="hover:bg-gold-soft/20">
          <td className="px-4 py-3">
            <StatusBadge meta={reservationStatusMeta(reservation.status)} />
          </td>
          <td className="px-4 py-3">
            {reservation.detailHref ? (
              <Link
                href={reservation.detailHref}
                className="font-medium text-mocha-deep transition-colors hover:text-ink hover:underline"
              >
                {reservation.productNameLabel}
              </Link>
            ) : (
              <span className="font-medium text-mocha-deep">
                {reservation.productNameLabel}
              </span>
            )}
            {reservation.variantSku ? (
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-md border border-gold-soft/70 bg-sand/60 px-1.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-mocha-deep">
                  {reservation.variantSku}
                </span>
                {reservation.variantOptions.map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center rounded-md border border-gold-soft/40 bg-white px-1.5 py-0.5 text-[0.7rem] text-mocha-deep"
                  >
                    {key}: {value}
                  </span>
                ))}
              </span>
            ) : (
              <span className="mt-0.5 block text-xs text-muted">
                Simple product
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
            {reservation.quantity}
          </td>
          <td className="px-4 py-3">
            <ReferenceCell reservation={reservation} />
          </td>
          <td className="px-4 py-3 text-muted">
            {reservation.expiresAt
              ? formatDateTime(reservation.expiresAt)
              : "—"}
          </td>
          <td className="px-4 py-3 text-muted">
            {formatDateTime(reservation.createdAt)}
          </td>
          <td className="px-4 py-3 text-muted">{resolvedText(reservation)}</td>
          <td className="px-4 py-3">
            <ReservationActions
              reservation={reservation}
              subjectName={reservation.productNameLabel}
              variantLabel={reservation.variantSku}
              onChanged={onChanged}
            />
          </td>
        </tr>
      ))}
    </>
  );
}
