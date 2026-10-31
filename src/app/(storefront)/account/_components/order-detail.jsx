"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getMyOrder } from "@/lib/api/orders";
import { getMyPayment } from "@/lib/api/payments";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import {
  orderStatusMeta,
  paymentMethodLabel,
  paymentStatusMeta,
} from "@/app/(admin)/admin/components/status-meta";
import { StatusBadge } from "@/app/(admin)/admin/components/status-badge";

const EASE = [0.22, 1, 0.36, 1];

function shortId(id) {
  return typeof id === "string" ? id.slice(0, 8) : "—";
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-sand bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Payment status for MANUAL orders. Reads the customer's own payment record
 * via `GET /orders/:orderId/payment`. A 404 simply means nothing has been
 * submitted yet; the backend customer payment serializer exposes status,
 * account snapshot, reference, amount and notes — no admin-only fields.
 */
function ManualPaymentStatus({ orderId }) {
  const [state, setState] = useState({
    status: "loading",
    payment: null,
  });

  useEffect(() => {
    let cancelled = false;
    getMyPayment(orderId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok && result.payload?.data?.payment) {
        setState({ status: "ready", payment: result.payload.data.payment });
      } else if (result.status === 404) {
        setState({ status: "none", payment: null });
      } else {
        setState({ status: "error", payment: null });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-3 text-sm text-muted">
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-2 border-gold-soft border-t-gold motion-safe:animate-spin"
        />
        Loading payment status…
      </div>
    );
  }

  if (state.status === "none") {
    return (
      <div>
        <p className="text-sm text-mocha-deep">
          No payment has been submitted for this order yet.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Once your transfer proof is submitted, its status will appear here.
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <p className="text-sm text-mocha-deep">
        We couldn&apos;t load the payment status right now. Please try again
        later.
      </p>
    );
  }

  const payment = state.payment;
  const accountLine = [
    payment.paymentMethod?.displayName,
    payment.paymentMethod?.accountNumber,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge meta={paymentStatusMeta(payment.status)} />
        {payment.createdAt ? (
          <span className="text-xs text-muted">
            Submitted {formatDateTime(payment.createdAt)}
          </span>
        ) : null}
      </div>
      <dl className="divide-y divide-sand">
        {accountLine ? (
          <DetailRow label="Transferred to">{accountLine}</DetailRow>
        ) : null}
        {payment.transactionReference ? (
          <DetailRow label="Reference">{payment.transactionReference}</DetailRow>
        ) : null}
        {payment.submittedAmountMinorUnits != null ? (
          <DetailRow label="Submitted amount">
            {formatMinorUnits(payment.submittedAmountMinorUnits)}
          </DetailRow>
        ) : null}
        {payment.notes ? (
          <DetailRow label="Notes">
            <span className="block max-w-[240px] text-right">{payment.notes}</span>
          </DetailRow>
        ) : null}
      </dl>
    </div>
  );
}

function variantSummary(item) {
  const attributes = item.variantAttributes || {};
  const parts = Object.entries(attributes).map(
    ([key, value]) => `${key}: ${value}`,
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Single customer order fetched from `GET /orders/:id` (customer-scoped —
 * another customer's order resolves as a 404). Renders exactly the customer
 * serializer's fields: identifiers, status + history, totals, delivery, items,
 * payment method, notes. Reservation internals are never shown to customers.
 */
export function OrderDetail({ orderId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    order: null,
  });

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      order: prev.order,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getMyOrder(orderId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          order: null,
        });
        return;
      }
      setFetchState({
        status: "ready",
        message: null,
        order: result.payload?.data?.order ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [orderId, reloadKey]);

  const { status, message, order } = fetchState;

  if (status === "loading") {
    return (
      <div aria-hidden="true" className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-sand" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-sand" />
          <div className="h-48 animate-pulse rounded-2xl bg-sand" />
        </div>
        <div className="h-56 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-3xl border border-red-200/80 bg-red-50/70 p-8 text-center"
      >
        <h2 className="font-display text-xl text-ink">Order unavailable</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mocha-deep">
          {message}
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-mocha px-6 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const address = order.delivery?.address;
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to my orders
        </Link>

        <section className="rounded-2xl border border-sand bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Order number
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                {order.orderNumber || shortId(order.id)}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Placed {formatDateTime(order.createdAt)} · {itemCount} item
                {itemCount === 1 ? "" : "s"} ·{" "}
                {paymentMethodLabel(order.paymentMethod)}
              </p>
            </div>
            <StatusBadge meta={orderStatusMeta(order.status)} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Delivery address">
            <dl className="divide-y divide-sand">
              <DetailRow label="Name">
                {address?.fullName || shortId(order.customerId)}
              </DetailRow>
              <DetailRow label="Phone">{address?.phone || "—"}</DetailRow>
              <DetailRow label="Address">
                <span className="block max-w-[240px] text-right">
                  {[
                    address?.line1,
                    address?.line2,
                    address?.area,
                    address?.city,
                    address?.district,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </span>
              </DetailRow>
              <DetailRow label="Postal code">
                {address?.postalCode || "—"}
              </DetailRow>
              <DetailRow label="Country">{address?.country || "—"}</DetailRow>
            </dl>
          </SectionCard>

          <SectionCard title="Payment & delivery">
            <dl className="divide-y divide-sand">
              <DetailRow label="Payment method">
                {paymentMethodLabel(order.paymentMethod)}
              </DetailRow>
              <DetailRow label="Delivery zone">
                {order.delivery?.zone
                  ? order.delivery.zone.replaceAll("_", " ")
                  : "—"}
              </DetailRow>
              <DetailRow label="Delivery fee">
                {formatMinorUnits(order.delivery?.deliveryFeeMinorUnits)}
              </DetailRow>
              <DetailRow label="Order notes">
                <span className="block max-w-[240px] text-right">
                  {order.notes || "—"}
                </span>
              </DetailRow>
            </dl>
          </SectionCard>
        </div>

        {order.paymentMethod === "MANUAL" ? (
          <SectionCard title="Payment status">
            <ManualPaymentStatus orderId={order.id} />
          </SectionCard>
        ) : null}

        <SectionCard title="Items">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Product
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Qty
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Unit price
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Line total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {items.map((item) => {
                  const variant = variantSummary(item);
                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-ink">{item.productName}</p>
                        {variant ? (
                          <p className="text-xs text-muted">{variant}</p>
                        ) : null}
                        {item.sku ? (
                          <p className="text-xs text-muted">{item.sku}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-ink">
                        {item.quantity}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-ink">
                        {formatMinorUnits(item.unitPriceMinorUnits)}
                        {Number(item.discountMinorUnits) > 0 ? (
                          <span className="ml-1 text-xs text-muted">
                            −{formatMinorUnits(item.discountMinorUnits)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 text-right font-semibold tabular-nums text-ink">
                        {formatMinorUnits(item.lineTotalMinorUnits)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 ml-auto w-full max-w-sm space-y-2 border-t border-sand pt-4 text-sm">
            <DetailRow label="Subtotal">
              {formatMinorUnits(order.totals?.itemsSubtotalMinorUnits)}
            </DetailRow>
            <DetailRow label="Discount">
              {Number(order.totals?.totalDiscountMinorUnits) > 0
                ? `−${formatMinorUnits(order.totals.totalDiscountMinorUnits)}`
                : "—"}
            </DetailRow>
            <DetailRow label="Delivery fee">
              {formatMinorUnits(order.totals?.deliveryFeeMinorUnits)}
            </DetailRow>
            <div className="flex items-start justify-between gap-6 border-t border-sand pt-2">
              <dt className="text-sm font-medium text-ink">Grand total</dt>
              <dd className="font-display text-lg font-semibold tabular-nums text-ink">
                {formatMinorUnits(order.totals?.grandTotalMinorUnits)}
              </dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Status history">
          {history.length === 0 ? (
            <p className="text-sm text-muted">No status changes recorded.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge meta={orderStatusMeta(entry.status)} />
                      <span className="text-xs text-muted">
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-1 text-sm text-mocha-deep">{entry.note}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </motion.div>
  );
}
