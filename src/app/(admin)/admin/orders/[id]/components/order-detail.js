"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  CircleAlert,
  CreditCard,
  History,
  Landmark,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  Undo2,
  User,
  X,
} from "lucide-react";
import { getAdminOrder } from "@/lib/api/orders";
import { getAdminShipments } from "@/lib/api/courier-shipments";
import {
  getAdminPayments,
  rejectPayment,
  verifyPayment,
} from "@/lib/api/payments";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import {
  orderStatusMeta,
  paymentMethodLabel,
  paymentStatusMeta,
} from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { OrderActions } from "../../components/order-actions";
import { CourierStatus } from "../../components/order-courier-status";
import {
  ORDER_LIFECYCLE,
  ORDER_TERMINAL_STATUSES,
  customerNameFor,
  deliveryAddressLinesFor,
  deliveryZoneLabelFor,
  isPaymentVerified,
  itemCountLabel,
  orderNumberFor,
  reachedOrderLifecycleIndex,
  requiresPaymentVerification,
  reservationCountFor,
} from "../../components/order-utils";

const EASE = [0.22, 1, 0.36, 1];

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function SectionCard({ title, icon, children, className }) {
  return (
    <section className={`rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2.5 font-display text-lg text-ink">
        {icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-soft/40 text-gold">
            {icon}
          </span>
        ) : null}
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function variantSummary(item) {
  const attributes = item.variantAttributes || {};
  const parts = Object.entries(attributes).map(
    ([key, value]) => `${key}: ${value}`
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

function actorLabel() {
  // The serializer only ever exposes the acting staff/admin id, never a name.
  // Showing the id would leak a technical identifier, so we render "Staff"
  // with the recorded timestamp instead. The note has the human context.
  return "Staff";
}

/**
 * Forward-lifecycle stepper (Placed → Confirmed → Dispatched → Shipped →
 * Delivered → Completed) driven by the backend state machine. Completed steps
 * are gold with a check, the current step is outlined with a dot, and future
 * steps stay muted. Step timestamps come from the real status history, so the
 * stepper always reflects what actually happened.
 *
 * Terminal statuses render the steps they passed through and add a clear end
 * note. RETURNED is shown as an alternate terminal outcome branching from
 * SHIPPED — the courier status/tracking stays a separate resource and never
 * changes the Order status.
 */
function LifecycleStepper({ status, history }) {
  const reached = reachedOrderLifecycleIndex(status, history);
  const isTerminal = ORDER_TERMINAL_STATUSES.includes(status);
  const isReturned =
    status === "RETURNED" ||
    (Array.isArray(history) ? history : []).some(
      (entry) => entry?.status === "RETURNED"
    );
  const historyByStatus = new Map();
  for (const entry of Array.isArray(history) ? history : []) {
    if (entry?.status && !historyByStatus.has(entry.status)) {
      historyByStatus.set(entry.status, entry);
    }
  }
  const returnedEntry = historyByStatus.get("RETURNED");

  return (
    <div className="mt-5 rounded-2xl border border-gold-soft/60 bg-sand/40 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted">
          {isTerminal ? "Lifecycle ended" : "Lifecycle"}
        </p>
        {!isTerminal && reached >= 0 ? (
          <p className="text-xs tabular-nums text-muted">
            Step {reached + 1} of {ORDER_LIFECYCLE.length}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-1">
        <ol className="relative mt-4 flex min-w-[540px]">
          <span
            aria-hidden="true"
            className="absolute left-[6%] right-[6%] top-3 h-0.5 bg-gold-soft/70"
          />
          {ORDER_LIFECYCLE.map((step, index) => {
            const entry = historyByStatus.get(step);
            const done = index < reached;
            const current = !isTerminal && status === step;
            return (
              <li key={step} className="relative flex flex-1 flex-col items-center">
                <span
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-gold bg-gold text-white"
                      : current
                        ? "border-gold bg-white text-gold ring-2 ring-gold/40"
                        : "border-gold-soft bg-cream text-muted"
                  }`}
                >
                  {done ? (
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : current ? (
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
                  ) : null}
                </span>
                <span
                  className={`mt-1.5 text-center text-[0.65rem] font-medium leading-tight ${
                    done || current ? "text-ink" : "text-muted/70"
                  }`}
                >
                  {orderStatusMeta(step).label}
                </span>
                {entry?.at ? (
                  <span className="mt-0.5 text-center text-[0.6rem] tabular-nums text-muted/70">
                    {formatDateTime(entry.at)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      {isReturned ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/60 px-4 py-3"
        >
          <Undo2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rose-600" />
          <span className="text-xs font-medium text-mocha-deep">Shipped</span>
          <span
            aria-hidden="true"
            className="h-px w-8 border-t border-dashed border-rose-300"
          />
          <StatusBadge meta={orderStatusMeta("RETURNED")} />
          {returnedEntry?.at ? (
            <span className="text-xs tabular-nums text-muted">
              {formatDateTime(returnedEntry.at)}
            </span>
          ) : null}
          <p className="w-full text-xs leading-relaxed text-rose-600/90">
            Returned is an alternate terminal outcome — the order leaves the
            fulfillment flow after being shipped.
          </p>
        </motion.div>
      ) : null}

      {isTerminal ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#c9604d]/25 bg-red-50/60 px-3 py-2.5 text-xs leading-relaxed text-[#b35442]">
          <X aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {status === "REJECTED"
            ? "This order was rejected and is no longer in the fulfillment flow."
            : status === "RETURNED"
              ? "This order was returned and is no longer in the fulfillment flow."
              : "This order was cancelled and is no longer in the fulfillment flow."}
        </p>
      ) : null}
    </div>
  );
}

const PAYMENT_ACTION_META = {
  verify: {
    title: "Verify payment",
    description:
      "Verify this payment. Once verified it counts toward sales and cannot be changed.",
    confirmLabel: "Verify payment",
    className: "bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold",
  },
  reject: {
    title: "Reject payment",
    description:
      "Reject this payment. The customer will be able to resubmit with a corrected proof.",
    confirmLabel: "Reject payment",
    className:
      "bg-[#c9604d] text-white hover:bg-[#b35442] focus-visible:ring-[#c9604d]",
  },
};

const PAYMENT_SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

/**
 * Manual-payment section for an order. The order serializer carries no payment
 * record, but the backend admin payment list filters by exact order number
 * (GET /admin/payments?orderNumber=…), and SUBMITTED payments are verifiable
 * via POST /admin/payments/:id/verify|reject. The fetch state is lifted to the
 * parent so the hero actions share the same payment record for the
 * confirm-verification gate. Only shows Verify/Reject while a payment is
 * actually SUBMITTED. COD / card orders without a manual record simply show a
 * quiet "no payment" note.
 */
function OrderPaymentCard({ orderNumber, paymentState, onRefresh }) {
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { status, message, payment } = paymentState;
  const viewStatus = orderNumber ? status : "none";

  async function run(action, note) {
    if (!payment) {
      return;
    }
    setLoading(true);
    setError(null);
    const result =
      action === "verify"
        ? await verifyPayment(payment.id, note)
        : await rejectPayment(payment.id, note);
    setLoading(false);
    if (result.ok) {
      setDialog(null);
      onRefresh();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <SectionCard title="Payment record" icon={<Landmark aria-hidden="true" className="h-4 w-4" />}>
      {viewStatus === "loading" ? (
        <div aria-hidden="true" className="space-y-3">
          <div className="h-4 w-40 skeleton-shimmer rounded-full" />
          <div className="h-4 w-64 skeleton-shimmer rounded-full" />
          <div className="h-4 w-52 skeleton-shimmer rounded-full" />
        </div>
      ) : null}

      {viewStatus === "error" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{message}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : null}

      {viewStatus === "none" ? (
        <p className="text-sm leading-relaxed text-muted">
          No manual payment record for this order yet. When the customer
          submits a payment proof, it will appear here for review.
        </p>
      ) : null}

      {viewStatus === "ready" && payment ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge meta={paymentStatusMeta(payment.status)} />
            <span className="text-xs tabular-nums text-muted">
              Submitted {formatDateTime(payment.createdAt)}
            </span>
          </div>

          <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            <DetailRow label="Method">
              {payment.paymentMethod?.displayName || "—"}
            </DetailRow>
            <DetailRow label="Transaction ref">
              {payment.transactionReference || "—"}
            </DetailRow>
            <DetailRow label="Submitted amount">
              {formatMinorUnits(payment.submittedAmountMinorUnits)}
            </DetailRow>
            <DetailRow label="Expected amount">
              {formatMinorUnits(payment.expectedAmountMinorUnits)}
            </DetailRow>
          </dl>

          {payment.notes ? (
            <p className="mt-2 rounded-xl border border-gold-soft/60 bg-sand/50 px-4 py-3 text-sm text-mocha-deep">
              {payment.notes}
            </p>
          ) : null}

          {payment.proof?.secureUrl ? (
            <a
              href={payment.proof.secureUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
            >
              View payment proof
            </a>
          ) : null}

          {payment.status === "SUBMITTED" ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gold-soft/40 pt-4">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setDialog("verify");
                }}
                className={`${PAYMENT_SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
              >
                Verify payment
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setDialog("reject");
                }}
                className={`${PAYMENT_SMALL_BUTTON} border-[#c9604d]/40 text-[#c9604d] hover:bg-red-50`}
              >
                Reject payment
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {dialog && payment ? (
        <ConfirmDialog
          title={PAYMENT_ACTION_META[dialog].title}
          description={PAYMENT_ACTION_META[dialog].description}
          noteLabel="Note (optional)"
          confirmLabel={PAYMENT_ACTION_META[dialog].confirmLabel}
          confirmClassName={PAYMENT_ACTION_META[dialog].className}
          loading={loading}
          error={error}
          onConfirm={(note) => run(dialog, note)}
          onClose={() => {
            if (!loading) {
              setDialog(null);
              setError(null);
            }
          }}
        >
          <div className="rounded-xl border border-gold-soft/70 bg-sand/50 p-4">
            <dl className="space-y-2">
              <DetailRow label="Order">{orderNumber}</DetailRow>
              <DetailRow label="Method">
                {payment.paymentMethod?.displayName || "—"}
              </DetailRow>
              <DetailRow label="Transaction ref">
                {payment.transactionReference || "—"}
              </DetailRow>
              <DetailRow label="Submitted amount">
                {formatMinorUnits(payment.submittedAmountMinorUnits)}
              </DetailRow>
              <DetailRow label="Expected amount">
                {formatMinorUnits(payment.expectedAmountMinorUnits)}
              </DetailRow>
            </dl>
            {payment.proof?.secureUrl ? (
              <a
                href={payment.proof.secureUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
              >
                View payment proof
              </a>
            ) : null}
          </div>
        </ConfirmDialog>
      ) : null}
    </SectionCard>
  );
}

export function OrderDetail({ orderId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    order: null,
  });
  const [courier, setCourier] = useState({
    status: "loading",
    shipment: null,
    message: null,
  });
  const [paymentState, setPaymentState] = useState({
    status: "loading",
    message: null,
    payment: null,
  });
  const [paymentReloadKey, setPaymentReloadKey] = useState(0);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      order: prev.order,
    }));
  }

  function handleRefresh() {
    startLoading();
    setCourier({ status: "loading", shipment: null, message: null });
    setPaymentState({ status: "loading", message: null, payment: null });
    setReloadKey((key) => key + 1);
  }

  function refreshPayment() {
    setPaymentState({ status: "loading", message: null, payment: null });
    setPaymentReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminOrder(orderId).then((result) => {
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

  useEffect(() => {
    if (!orderId) {
      return undefined;
    }
    let cancelled = false;
    getAdminShipments({ orderId, page: 1, limit: 1 }).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setCourier({
          status: "error",
          shipment: null,
          message: safeMessage(result.status, result.payload),
        });
        return;
      }
      const shipments = Array.isArray(result.payload?.data?.shipments)
        ? result.payload.data.shipments
        : [];
      setCourier({
        status: "ready",
        shipment: shipments[0] ?? null,
        message: null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [orderId, reloadKey]);

  const { status, message, order } = fetchState;
  const orderNumber = order ? orderNumberFor(order) : "";

  useEffect(() => {
    if (!orderNumber) {
      return undefined;
    }
    let cancelled = false;
    getAdminPayments({ orderNumber, page: 1, limit: 5 }).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setPaymentState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          payment: null,
        });
        return;
      }
      const payments = Array.isArray(result.payload?.data?.payments)
        ? result.payload.data.payments
        : [];
      setPaymentState({
        status: payments.length > 0 ? "ready" : "none",
        message: null,
        payment: payments[0] ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [orderNumber, paymentReloadKey]);

  if (status === "loading") {
    return (
      <div aria-hidden="true" className="space-y-4">
        <div className="h-24 skeleton-shimmer rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 skeleton-shimmer rounded-2xl" />
          <div className="h-48 skeleton-shimmer rounded-2xl" />
        </div>
        <div className="h-40 skeleton-shimmer rounded-2xl" />
        <div className="h-56 skeleton-shimmer rounded-2xl" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
      >
        <h2 className="font-display text-lg text-ink">Order unavailable</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">
          {message}
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const reservationCount = reservationCountFor(order);
  const addressLines = deliveryAddressLinesFor(order);
  const zoneLabel = deliveryZoneLabelFor(order);
  const needsPaymentVerification = requiresPaymentVerification(order);
  const paymentVerified = isPaymentVerified(paymentState.payment);

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to orders
        </Link>

        {/* Hero */}
        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Order number
              </p>
              <h2 className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {orderNumberFor(order)}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Placed {formatDateTime(order.createdAt)} ·{" "}
                {itemCountLabel(order)} · {paymentMethodLabel(order.paymentMethod)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <StatusBadge meta={orderStatusMeta(order.status)} />
              <CourierStatus state={courier} onRetry={handleRefresh} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gold-soft/40 pt-4">
            <p className="text-xs text-muted">
              {order.updatedAt ? (
                <>Updated {formatDateTime(order.updatedAt)}</>
              ) : null}
            </p>
            <OrderActions
              order={order}
              onChanged={handleRefresh}
              courier={courier}
              payment={paymentState}
            />
          </div>

          {needsPaymentVerification ? (
            paymentVerified ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3"
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                />
                <p className="text-sm leading-relaxed text-emerald-800">
                  Payment verified — this manual-payment order is ready to be
                  confirmed.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3"
              >
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                />
                <p className="text-sm leading-relaxed text-amber-800">
                  <span className="font-semibold">
                    Payment verification required
                  </span>{" "}
                  — this manual-payment order cannot be confirmed until its
                  payment record is verified. Review the payment record below.
                </p>
              </motion.div>
            )
          ) : null}

          <LifecycleStepper status={order.status} history={history} />
        </section>

        {/* Customer + delivery/payment */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Customer" icon={<User aria-hidden="true" className="h-4 w-4" />}>
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Name">{customerNameFor(order)}</DetailRow>
              <DetailRow label="Phone">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Phone aria-hidden="true" className="h-3.5 w-3.5 text-muted/70" />
                  {address?.phone || "—"}
                </span>
              </DetailRow>
              <DetailRow label="Address">
                <span className="block max-w-[240px] text-right">
                  {addressLines.length > 0
                    ? addressLines.map((line, index) => (
                        <span key={index} className="block">
                          {line}
                        </span>
                      ))
                    : "—"}
                </span>
              </DetailRow>
            </dl>
          </SectionCard>

          <SectionCard
            title="Payment & delivery"
            icon={<CreditCard aria-hidden="true" className="h-4 w-4" />}
          >
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Payment method">
                {paymentMethodLabel(order.paymentMethod)}
              </DetailRow>
              <DetailRow label="Delivery zone">
                <span className="inline-flex items-center gap-1.5">
                  <Truck aria-hidden="true" className="h-3.5 w-3.5 text-muted/70" />
                  {zoneLabel || "—"}
                </span>
              </DetailRow>
              <DetailRow label="Delivery fee">
                {formatMinorUnits(order.delivery?.deliveryFeeMinorUnits)}
              </DetailRow>
              <DetailRow label="Order notes">
                <span className="block max-w-[220px] text-right">
                  {order.notes || "—"}
                </span>
              </DetailRow>
            </dl>
          </SectionCard>
        </div>

        <OrderPaymentCard
          orderNumber={orderNumber}
          paymentState={paymentState}
          onRefresh={refreshPayment}
        />

        {/* Items */}
        <SectionCard title="Items" icon={<Package aria-hidden="true" className="h-4 w-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Product</th>
                  <th scope="col" className="py-2 pr-4 font-medium">SKU</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Qty</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Unit price</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Discount</th>
                  <th scope="col" className="py-2 text-right font-medium">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-soft/40">
                {items.map((item) => {
                  const variant = variantSummary(item);
                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-ink">{item.productName}</p>
                        {variant ? (
                          <p className="text-xs text-muted">{variant}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-muted">{item.sku || "—"}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-ink">
                        {item.quantity}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right tabular-nums text-ink">
                        {formatMinorUnits(item.unitPriceMinorUnits)}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right tabular-nums text-muted">
                        {Number(item.discountMinorUnits) > 0
                          ? `−${formatMinorUnits(item.discountMinorUnits)}`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap py-3 text-right font-semibold tabular-nums text-ink">
                        {formatMinorUnits(item.lineTotalMinorUnits)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 ml-auto w-full max-w-sm space-y-2 border-t border-gold-soft/40 pt-4 text-sm">
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
            <div className="flex items-start justify-between gap-6 border-t border-gold-soft/40 pt-2">
              <dt className="text-sm font-medium text-ink">Grand total</dt>
              <dd className="font-display text-lg font-semibold tabular-nums text-ink">
                {formatMinorUnits(order.totals?.grandTotalMinorUnits)}
              </dd>
            </div>
          </dl>
        </SectionCard>

        {/* Status history */}
        <SectionCard
          title="Status history"
          icon={<History aria-hidden="true" className="h-4 w-4" />}
        >
          {history.length === 0 ? (
            <p className="text-sm text-muted">No status changes recorded.</p>
          ) : (
            <ol>
              {history.map((entry, index) => (
                <li key={index} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < history.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[5px] top-4 h-full w-px bg-gold-soft/70"
                    />
                  ) : null}
                  <span className="relative mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-gold bg-gold/25" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge meta={orderStatusMeta(entry.status)} />
                      <span className="text-xs tabular-nums text-muted">
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-1 text-sm text-mocha-deep">{entry.note}</p>
                    ) : null}
                    {entry.by ? (
                      <p className="mt-0.5 text-xs text-muted">
                        By {actorLabel()}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        {reservationCount > 0 ? (
          <SectionCard
            title="Reservation reference"
            icon={<Package aria-hidden="true" className="h-4 w-4" />}
          >
            <p className="text-sm text-muted">
              {reservationCount} reservation
              {reservationCount === 1 ? "" : "s"} held for this order.
            </p>
          </SectionCard>
        ) : null}
      </motion.div>
  );
}
