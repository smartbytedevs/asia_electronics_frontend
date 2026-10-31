"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getOrderStatus } from "@/lib/api/orders";
import { safeMessage } from "@/lib/api/http";
import { formatDate, formatMinorUnits } from "@/lib/utils";
import {
  orderStatusMeta,
  paymentMethodLabel,
} from "@/app/(admin)/admin/components/status-meta";
import { StatusBadge } from "@/app/(admin)/admin/components/status-badge";
import {
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  TruckIcon,
} from "./icons";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Forward order lifecycle, mirroring the backend state machine. Only the
 * current status is available from the public status endpoint (it deliberately
 * omits statusHistory), so the stepper highlights the current step and never
 * invents timestamps or statuses.
 */
const ORDER_LIFECYCLE = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

/** Statuses that end the order outside the forward lifecycle. */
const TERMINAL_STATUSES = ["CANCELLED", "REJECTED"];

/**
 * Visual lifecycle stepper: completed steps are gold with a check, the current
 * step is outlined with a dot, future steps stay muted. Terminal statuses
 * (CANCELLED / REJECTED) render the steps muted with a clear end note.
 */
function LifecycleStepper({ status }) {
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const current = isTerminal ? -1 : ORDER_LIFECYCLE.indexOf(status);

  return (
    <div className="mt-5 rounded-2xl border border-gold-soft/60 bg-sand/40 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted">
          {isTerminal ? "Lifecycle ended" : "Order lifecycle"}
        </p>
        {!isTerminal && current >= 0 ? (
          <p className="text-xs tabular-nums text-muted">
            Step {current + 1} of {ORDER_LIFECYCLE.length}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-1">
        <ol className="relative mt-4 flex min-w-[560px]">
          <span
            aria-hidden="true"
            className="absolute left-[6%] right-[6%] top-3 h-0.5 bg-gold-soft/70"
          />
          {ORDER_LIFECYCLE.map((step, index) => {
            const done = !isTerminal && current >= 0 && index < current;
            const isCurrent = !isTerminal && index === current;
            return (
              <li key={step} className="relative flex flex-1 flex-col items-center">
                <span
                  aria-hidden="true"
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-gold bg-gold text-white"
                      : isCurrent
                        ? "border-gold bg-white text-gold ring-2 ring-gold/40"
                        : "border-gold-soft bg-cream text-muted"
                  }`}
                >
                  {done ? (
                    <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
                  ) : null}
                </span>
                <span
                  className={`mt-1.5 text-center text-[0.65rem] font-medium leading-tight ${
                    done || isCurrent ? "text-ink" : "text-muted/70"
                  }`}
                >
                  {orderStatusMeta(step).label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {isTerminal ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#c9604d]/25 bg-red-50/60 px-3 py-2.5 text-xs leading-relaxed text-[#b35442]">
          <CloseIcon aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {status === "REJECTED"
            ? "This order was rejected and is no longer in the fulfillment flow."
            : "This order was cancelled and is no longer in the fulfillment flow."}
        </p>
      ) : null}
    </div>
  );
}

function OrderResult({ order, onReset }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const totals = order.totals || {};

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-gold-soft/70 bg-white p-5 shadow-sm shadow-ink/5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Order number
            </p>
            <h2 className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {order.orderNumber || "—"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Placed {formatDate(order.createdAt)} · {itemCount} item
              {itemCount === 1 ? "" : "s"} · {paymentMethodLabel(order.paymentMethod)}
            </p>
          </div>
          <StatusBadge meta={orderStatusMeta(order.status)} />
        </div>
        <LifecycleStepper status={order.status} />
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg text-ink">Items</h2>
        <ul className="mt-3 divide-y divide-sand">
          {items.map((item, index) => (
            <li key={index} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{item.productName}</p>
                <p className="text-xs text-muted">Qty {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatMinorUnits(item.lineTotalMinorUnits)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-sand pt-4 text-sm">
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums text-ink">
              {formatMinorUnits(totals.itemsSubtotalMinorUnits)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted">Discount</dt>
            <dd className="tabular-nums text-muted">
              {Number(totals.totalDiscountMinorUnits) > 0
                ? `−${formatMinorUnits(totals.totalDiscountMinorUnits)}`
                : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted">Delivery fee</dt>
            <dd className="tabular-nums text-ink">
              {formatMinorUnits(totals.deliveryFeeMinorUnits)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6 border-t border-sand pt-2">
            <dt className="font-medium text-ink">Grand total</dt>
            <dd className="font-display text-lg font-semibold tabular-nums text-ink">
              {formatMinorUnits(totals.grandTotalMinorUnits)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-mocha/25 px-6 py-3 text-sm font-medium text-mocha transition-colors hover:border-mocha hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <TruckIcon className="h-4 w-4" />
          Track another order
        </button>
      </div>
    </motion.div>
  );
}

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-mocha/40 focus:outline-none focus:ring-2 focus:ring-gold/50";

/**
 * Guest order tracker. Lets anyone check an order's status with the order
 * number from their confirmation plus the delivery phone, via the existing
 * public `GET /orders/status` contract. Renders the order's lifecycle, items
 * and totals without ever exposing MongoDB or internal ids.
 */
export function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState({ status: "idle", order: null });
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const number = orderNumber.trim();
    const phoneValue = phone.trim();
    if (!number || !phoneValue) {
      setFieldError(
        "Please enter both your order number and the phone number you checked out with."
      );
      return;
    }
    setFieldError("");
    setMessage("");
    setState({ status: "loading", order: null });
    const result = await getOrderStatus({
      orderNumber: number,
      phone: phoneValue,
    });
    if (result.ok && result.payload?.data?.order) {
      setState({ status: "ready", order: result.payload.data.order });
    } else if (result.status === 404) {
      setState({ status: "notFound", order: null });
      setMessage(
        "We couldn't find an order matching that order number and phone. Please double-check both and try again."
      );
    } else {
      setState({ status: "error", order: null });
      setMessage(safeMessage(result.status, result.payload));
    }
  }

  function reset() {
    setOrderNumber("");
    setPhone("");
    setMessage("");
    setFieldError("");
    setState({ status: "idle", order: null });
  }

  const isLoading = state.status === "loading";
  const ready = state.status === "ready" && state.order;

  return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="text-center">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
            Order tracking
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
            Track your order
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            See where your Asia Electronics order is, from confirmation to your
            doorstep.
          </p>
        </header>

        <div className="mt-8">
          <AnimatePresence mode="wait" initial={false}>
            {ready ? (
              <OrderResult
                key="result"
                order={state.order}
                onReset={reset}
              />
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                onSubmit={handleSubmit}
                noValidate
                className="rounded-2xl border border-gold-soft/70 bg-white p-5 shadow-sm shadow-ink/5 sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft/40 text-gold">
                    <TruckIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg text-ink">
                      Order number + phone
                    </h2>
                    <p className="text-sm text-muted">
                      Both are needed to look up your order.
                    </p>
                  </div>
                </div>

                {fieldError ? (
                  <p
                    role="alert"
                    className="mt-5 rounded-xl border border-[#c9604d]/25 bg-red-50/60 px-4 py-3 text-sm leading-relaxed text-[#b35442]"
                  >
                    {fieldError}
                  </p>
                ) : null}

                {state.status === "notFound" ? (
                  <div
                    role="status"
                    className="mt-5 flex items-start gap-3 rounded-xl border border-gold-soft/60 bg-sand/50 px-4 py-3"
                  >
                    <TruckIcon
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                    />
                    <p className="text-sm leading-relaxed text-mocha-deep">
                      {message}
                    </p>
                  </div>
                ) : null}

                {state.status === "error" ? (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-3 rounded-xl border border-[#c9604d]/25 bg-red-50/60 px-4 py-3"
                  >
                    <CloseIcon
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#b35442]"
                    />
                    <p className="text-sm leading-relaxed text-[#b35442]">
                      {message}
                    </p>
                  </div>
                ) : null}

                <label htmlFor="track-order-number" className="mt-6 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Order number
                  </span>
                  <input
                    id="track-order-number"
                    type="text"
                    value={orderNumber}
                    onChange={(event) => setOrderNumber(event.target.value)}
                    placeholder="e.g. TAQ-20260814-000123"
                    autoComplete="off"
                    spellCheck={false}
                    className={INPUT_CLASS}
                  />
                </label>

                <label htmlFor="track-order-phone" className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Phone number
                  </span>
                  <input
                    id="track-order-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="e.g. 01712 345678"
                    autoComplete="tel"
                    className={INPUT_CLASS}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full border-2 border-cream/30 border-t-cream motion-safe:animate-spin"
                      />
                      Tracking…
                    </>
                  ) : (
                    <>
                      Track order
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
  );
}
