"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CircleAlert } from "lucide-react";
import {
  cancelOrder,
  completeOrder,
  confirmOrder,
  deliverOrder,
  rejectOrder,
  returnOrder,
  shipOrder,
} from "@/lib/api/orders";
import { dispatchShipment } from "@/lib/api/courier-shipments";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";
import {
  isManualPaymentOrder,
  isPaymentVerified,
  orderNumberFor,
} from "./order-utils";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Admin order actions, derived 1:1 from the backend state machine and the
 * routes that actually exist (adminOrder.routes.js + courier dispatch):
 *
 *   PENDING    → Confirm, Reject, Cancel      (POST /:id/confirm, /:id/reject, /:id/cancel)
 *   CONFIRMED  → Dispatch, Cancel             (POST /courier/dispatch, /:id/cancel)
 *   PROCESSING → Dispatch, Cancel             (legacy compatibility)
 *   DISPATCHED → Ship, Cancel                 (POST /:id/ship, /:id/cancel)
 *   SHIPPED    → Deliver, Return, Cancel      (POST /:id/deliver, /:id/return, /:id/cancel)
 *   DELIVERED  → Complete                     (POST /:id/complete)
 *   COMPLETED / RETURNED / REJECTED / CANCELLED → none (terminal)
 *
 * The Order status is the SINGLE source of truth — Pathao webhook/reconciliation
 * updates move the CourierShipment, never the Order, so no action here ever
 * derives from courier status. Dispatch is still hidden whenever a shipment
 * already exists in a courier state that owns the order (ACTIVE / DELIVERED /
 * CANCELLED) and while the per-order shipment check is loading or failed, so
 * we never offer a dispatch the backend would answer with a 409.
 *
 * Manual-payment orders (MANUAL / BKASH / BANK_TRANSFER) cannot be confirmed
 * until their payment record is VERIFIED (backend confirmOrder gate). When the
 * order is PENDING and manual, Confirm is hidden and a clear
 * "Payment verification required" notice is shown instead until the payment is
 * verified. `payment` is the per-order payment fetch state
 * `{ status, payment, message }`.
 */
const ACTION_META = {
  confirm: {
    label: "Confirm",
    title: "Confirm order",
    description: (order) =>
      `Move ${orderNumberFor(order)} to Confirmed. The customer is notified and fulfillment can begin.`,
    confirmLabel: "Confirm order",
    buttonClass: "border-gold bg-gold text-white hover:bg-gold/90",
    dialogClass: "bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold",
  },
  dispatch: {
    label: "Dispatch to courier",
    title: "Dispatch to courier",
    description: (order) =>
      `Hand ${orderNumberFor(order)} over to the courier. A tracked shipment is created, the order moves to Dispatched, and the customer receives the consignment number.`,
    confirmLabel: "Dispatch",
    buttonClass: "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100",
    dialogClass:
      "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-600",
  },
  ship: {
    label: "Mark shipped",
    title: "Mark order shipped",
    description: (order) =>
      `Move ${orderNumberFor(order)} to Shipped. Use this once the parcel has actually left with the courier.`,
    confirmLabel: "Mark shipped",
    buttonClass:
      "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    dialogClass:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-600",
  },
  deliver: {
    label: "Mark delivered",
    title: "Mark order delivered",
    description: (order) =>
      `Move ${orderNumberFor(order)} to Delivered. Stock reserved for this order is consumed at this step.`,
    confirmLabel: "Mark delivered",
    buttonClass:
      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    dialogClass:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600",
  },
  complete: {
    label: "Mark completed",
    title: "Complete order",
    description: (order) =>
      `Move ${orderNumberFor(order)} to Completed. This is the final step of the order lifecycle.`,
    confirmLabel: "Mark completed",
    buttonClass:
      "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
    dialogClass:
      "bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-700",
  },
  return: {
    label: "Return order",
    title: "Return order",
    description: (order) =>
      `Return ${orderNumberFor(order)}. The order leaves the fulfillment flow and reserved stock is released. This action is final.`,
    confirmLabel: "Return order",
    buttonClass: "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100",
    dialogClass:
      "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600",
  },
  cancel: {
    label: "Cancel",
    title: "Cancel order",
    description: (order) =>
      `Cancel ${orderNumberFor(order)}. Reserved stock is released, any courier shipment is cancelled, and the customer is notified. This action is final.`,
    confirmLabel: "Cancel order",
    buttonClass: "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100",
    dialogClass:
      "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600",
  },
  reject: {
    label: "Reject",
    title: "Reject order",
    description: (order) =>
      `Reject ${orderNumberFor(order)}. This action is final and cannot be undone.`,
    confirmLabel: "Reject order",
    buttonClass: "border-[#c9604d]/40 text-[#c9604d] hover:bg-red-50",
    dialogClass:
      "bg-[#c9604d] text-white hover:bg-[#b35442] focus-visible:ring-[#c9604d]",
  },
};

/** When a manual PENDING order cannot be confirmed yet, show one of these. */
function confirmationBlockReason(order, paymentState) {
  if (!isManualPaymentOrder(order)) {
    return null;
  }
  const state = paymentState?.status;
  if (state === "loading") {
    return { checking: true, message: "Checking payment status…" };
  }
  if (state === "error") {
    return {
      checking: false,
      message:
        "Payment status unavailable — verify the payment before confirming.",
    };
  }
  if (state === "ready") {
    if (isPaymentVerified(paymentState.payment)) {
      return null;
    }
    const paymentStatus = paymentState.payment?.status;
    if (paymentStatus === "SUBMITTED") {
      return {
        checking: false,
        message: "Awaiting payment verification before confirming.",
      };
    }
    if (paymentStatus === "REJECTED") {
      return {
        checking: false,
        message: "Payment rejected — a resubmission is required to confirm.",
      };
    }
  }
  return {
    checking: false,
    message: "Payment verification required before confirming.",
  };
}

const SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

const calls = {
  confirm: confirmOrder,
  dispatch: dispatchShipment,
  reject: rejectOrder,
  ship: shipOrder,
  deliver: deliverOrder,
  return: returnOrder,
  complete: completeOrder,
  cancel: cancelOrder,
};

function availableActionsFor(status, courierState, shipmentStatus) {
  const dispatchHidden =
    courierState === "loading" ||
    courierState === "error" ||
    ["ACTIVE", "DELIVERED", "CANCELLED"].includes(shipmentStatus);
  switch (status) {
    case "PENDING":
      return ["confirm", "reject", "cancel"];
    case "CONFIRMED":
    case "PROCESSING":
      return dispatchHidden ? ["cancel"] : ["dispatch", "cancel"];
    case "DISPATCHED":
      return ["ship", "cancel"];
    case "SHIPPED":
      return ["deliver", "return", "cancel"];
    case "DELIVERED":
      return ["complete"];
    default:
      return [];
  }
}

export function OrderActions({ order, onChanged, courier, payment }) {
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const block = confirmationBlockReason(order, payment);
  const actions = availableActionsFor(
    order?.status,
    courier?.status,
    courier?.shipment?.status
  ).filter((action) => action !== "confirm" || !block);

  if (actions.length === 0 && !block) {
    return <span className="text-xs text-muted/60">—</span>;
  }

  async function run(action, note) {
    setLoading(true);
    setError(null);
    const result = await calls[action](order.id, note);
    setLoading(false);
    if (result.ok) {
      setDialog(null);
      onChanged();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {block ? (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              block.checking
                ? "border-gold-soft/80 bg-sand text-muted"
                : "border-amber-300/80 bg-amber-50 text-amber-800"
            }`}
            title={block.message}
          >
            {block.checking ? (
              <span
                aria-hidden="true"
                className="h-3 w-12 skeleton-shimmer rounded-full"
              />
            ) : (
              <CircleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            )}
            {block.checking ? "Checking payment…" : "Payment verification required"}
          </motion.span>
        ) : null}

        {actions.map((action) => {
          const meta = ACTION_META[action];
          return (
            <button
              key={action}
              type="button"
              onClick={() => {
                setError(null);
                setDialog(action);
              }}
              className={`${SMALL_BUTTON} ${meta.buttonClass}`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {block && !block.checking ? (
        <p className="mt-1.5 text-xs leading-snug text-amber-700">
          {block.message}
        </p>
      ) : null}

      {dialog ? (
        <ConfirmDialog
          title={ACTION_META[dialog].title}
          description={ACTION_META[dialog].description(order)}
          noteLabel="Note (optional)"
          confirmLabel={ACTION_META[dialog].confirmLabel}
          confirmClassName={ACTION_META[dialog].dialogClass}
          loading={loading}
          error={error}
          onConfirm={(note) => run(dialog, note)}
          onClose={() => {
            if (!loading) {
              setDialog(null);
              setError(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
