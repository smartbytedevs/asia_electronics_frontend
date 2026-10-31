import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { reservationStatusMeta } from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { ReservationActions } from "./reservation-actions";

function variantLabel(reservation) {
  if (reservation.variantSku) {
    const attributes = reservation.variantOptions
      .map(([key, value]) => `${key}: ${value}`)
      .join(" · ");
    return attributes
      ? `${reservation.variantSku} · ${attributes}`
      : reservation.variantSku;
  }
  return null;
}

function ReferenceText({ reservation }) {
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
              className="block text-xs text-muted transition-colors hover:text-mocha-deep hover:underline"
            >
              {meta.customerName}
            </Link>
          ) : (
            <p className="text-xs text-muted">{meta.customerName}</p>
          )
        ) : (
          <p className="text-xs text-muted">{meta.fallback}</p>
        )}
      </>
    );
  }
  return (
    <p className="text-xs text-muted">
      {meta.referenceType} · {meta.referenceId}
    </p>
  );
}

/**
 * Mobile reservation card — the product-group header is rendered by the
 * parent, each card mirrors the desktop table row with enriched labels.
 */
export function ReservationCard({ reservation, onChanged }) {
  const label = variantLabel(reservation);
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {reservation.detailHref ? (
            <Link
              href={reservation.detailHref}
              className="font-medium text-ink transition-colors hover:text-mocha-deep hover:underline"
            >
              {reservation.productNameLabel}
            </Link>
          ) : (
            <span className="font-medium text-ink">
              {reservation.productNameLabel}
            </span>
          )}
          {label ? (
            <p className="mt-0.5 text-sm text-mocha-deep">{label}</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">Simple product</p>
          )}
          <div className="mt-0.5">
            <ReferenceText reservation={reservation} />
          </div>
        </div>
        <StatusBadge meta={reservationStatusMeta(reservation.status)} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-gold-soft/40 bg-white/60 p-3 text-sm">
        <dt className="text-muted">Quantity</dt>
        <dd className="text-right font-semibold tabular-nums text-ink">
          {reservation.quantity}
        </dd>
        <dt className="text-muted">Expires</dt>
        <dd className="text-right text-ink">
          {reservation.expiresAt ? formatDateTime(reservation.expiresAt) : "—"}
        </dd>
        <dt className="text-muted">Created</dt>
        <dd className="text-right text-ink">
          {formatDateTime(reservation.createdAt)}
        </dd>
      </dl>

      <div className="mt-4 border-t border-gold-soft/40 pt-3">
        <ReservationActions
          reservation={reservation}
          subjectName={reservation.productNameLabel}
          variantLabel={label}
          onChanged={onChanged}
          className="justify-start"
        />
      </div>
    </div>
  );
}
