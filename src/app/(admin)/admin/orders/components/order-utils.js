/**
 * Shared, safe helpers for the admin order surface.
 *
 * These helpers exist so no component ever renders a MongoDB ObjectId or
 * another technical identifier to the client. The backend order serializer
 * always emits a human `orderNumber` (`TAQ-…`) and `delivery.address.fullName`,
 * so the fallbacks below only cover defensive cases — never raw ids.
 */

/** Human-readable order display value. Never a technical id. */
export function orderNumberFor(order) {
  const value = order?.orderNumber;
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return "Order";
}

/** Customer display name from the delivery address. */
export function customerNameFor(order) {
  const value = order?.delivery?.address?.fullName;
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return "Customer";
}

/** Delivery phone, normalized to a safe display value. */
export function customerPhoneFor(order) {
  const value = order?.delivery?.address?.phone;
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return null;
}

/** Real product names from the embedded order items. */
export function productNamesFor(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items
    .map((item) => item?.productName)
    .filter((name) => typeof name === "string" && name.trim() !== "");
}

/** Compact "2× Phone · 1× Charger" summary for list rows. */
export function productSummaryFor(order, max = 3) {
  const names = productNamesFor(order);
  if (names.length === 0) {
    return "—";
  }
  const items = Array.isArray(order?.items) ? order.items : [];
  const parts = names.slice(0, max).map((name, index) => {
    const quantity = items[index]?.quantity;
    return quantity > 1 ? `${quantity}× ${name}` : name;
  });
  if (names.length > max) {
    parts.push(`+${names.length - max} more`);
  }
  return parts.join(" · ");
}

/** Total units across all order items. */
export function totalQuantityFor(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
}

/** Unique product count for the list ("2 items" wording). */
export function itemCountLabel(order) {
  const names = productNamesFor(order);
  const count = names.length;
  return count === 1 ? "1 item" : `${count} items`;
}

/**
 * Free-text search across order number, customer name, phone, and product
 * names. Case- and whitespace-insensitive; multi-word queries must match every
 * word somewhere in the combined searchable text.
 */
export function orderMatchesSearch(order, query) {
  const normalized = String(query || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) {
    return true;
  }
  const words = normalized.split(" ").filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const haystack = [
    orderNumberFor(order),
    customerNameFor(order),
    customerPhoneFor(order) || "",
    productNamesFor(order).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return words.every((word) => haystack.includes(word));
}

/**
 * Forward order lifecycle, mirroring the backend state machine
 * (order.constants.js / order.state-machine.js). This is the ONLY forward
 * path — a stepper or "next step" derived from it can never invent a status
 * the backend does not persist.
 *
 * The admin surface drives the lifecycle without the intermediate PROCESSING
 * state: DISPATCHED is reached by a successful courier dispatch from CONFIRMED,
 * and everything after that (SHIPPED / DELIVERED / COMPLETED) is a staff/admin
 * manual action — the courier never changes the Order status.
 */
export const ORDER_LIFECYCLE = [
  "PENDING",
  "CONFIRMED",
  "DISPATCHED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

/** Statuses that end the order outside the forward lifecycle. */
export const ORDER_TERMINAL_STATUSES = ["CANCELLED", "REJECTED", "RETURNED"];

/** 0-based position of a status in the forward lifecycle, or -1 when it is not on that path. */
export function orderLifecycleIndex(status) {
  return ORDER_LIFECYCLE.indexOf(status);
}

/** The next forward status after `status`, or null at the end / off-path. */
export function nextOrderStatus(status) {
  const index = orderLifecycleIndex(status);
  if (index === -1 || index >= ORDER_LIFECYCLE.length - 1) {
    return null;
  }
  return ORDER_LIFECYCLE[index + 1];
}

/**
 * Highest forward-lifecycle step actually reached, derived from the current
 * status when it is on the forward path and otherwise from the recorded status
 * history (so a CANCELLED-at-SHIPPED order still shows the steps it really
 * passed through). Returns -1 when nothing on the forward path was reached.
 */
export function reachedOrderLifecycleIndex(currentStatus, history) {
  const current = orderLifecycleIndex(currentStatus);
  if (current >= 0) {
    return current;
  }
  let reached = -1;
  for (const entry of Array.isArray(history) ? history : []) {
    const index = orderLifecycleIndex(entry?.status);
    if (index > reached) {
      reached = index;
    }
  }
  return reached;
}

/**
 * Manual (off-platform) payment methods, mirroring the backend's
 * MANUAL_PAYMENT_METHODS (order.constants.js). Only these orders are gated:
 * the backend refuses to CONFIRM them until the payment record is VERIFIED.
 * `MANUAL` is the legacy pre-split value; `BKASH` / `BANK_TRANSFER` are the
 * concrete methods recorded at checkout.
 */
export const MANUAL_PAYMENT_METHODS = ["MANUAL", "BKASH", "BANK_TRANSFER"];

/** True when the order was paid via a manual payment method. */
export function isManualPaymentOrder(order) {
  return MANUAL_PAYMENT_METHODS.includes(order?.paymentMethod);
}

/** True when confirming this order is blocked until its payment is VERIFIED. */
export function requiresPaymentVerification(order) {
  return order?.status === "PENDING" && isManualPaymentOrder(order);
}

/** True when the supplied payment record has been verified by staff/admin. */
export function isPaymentVerified(payment) {
  return payment?.status === "VERIFIED";
}

/**
 * Payment-method filter. The backend order list has no payment filter, so this
 * runs client-side over the fetched page — it never invents an API contract.
 */
export function orderMatchesPaymentMethod(order, method) {
  if (!method || method === "ALL") {
    return true;
  }
  return order?.paymentMethod === method;
}

/**
 * Date-range filter (inclusive, local date). The backend order list has no
 * date filter, so this runs client-side over the fetched page — it never
 * invents an API contract.
 */
export function orderMatchesDateRange(order, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) {
    return true;
  }
  const created = order?.createdAt ? new Date(order.createdAt) : null;
  if (!created || Number.isNaN(created.getTime())) {
    return false;
  }
  const day = new Date(
    created.getFullYear(),
    created.getMonth(),
    created.getDate()
  ).getTime();
  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (!Number.isNaN(from.getTime()) && day < from.getTime()) {
      return false;
    }
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`);
    if (!Number.isNaN(to.getTime()) && day > to.getTime()) {
      return false;
    }
  }
  return true;
}

/** Delivery zone, normalized for display ("INSIDE_CHITTAGONG" → "Inside Chittagong"). */
export function deliveryZoneLabelFor(order) {
  const zone = order?.delivery?.zone;
  if (typeof zone === "string" && zone.trim() !== "") {
    return zone.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return null;
}

/** Readable multi-line delivery address for the detail view. */
export function deliveryAddressLinesFor(order) {
  const address = order?.delivery?.address;
  if (!address) {
    return [];
  }
  return [
    address.line1,
    address.line2,
    address.area,
    address.city,
    address.district,
    [address.postalCode, address.country].filter(Boolean).join(" ") || null,
  ].filter((part) => typeof part === "string" && part.trim() !== "");
}

/**
 * Safe reservation count for the detail view. The backend exposes only
 * reservation ids for traceability — never render them to the client.
 */
export function reservationCountFor(order) {
  const ids = order?.reservationReference?.reservationIds;
  if (!Array.isArray(ids) || ids.length === 0) {
    return 0;
  }
  return ids.length;
}

/**
 * Real order payment-method enum values for the filter dropdown
 * (backend order.constants.js — no invented values).
 */
export const PAYMENT_METHOD_FILTER_OPTIONS = [
  "COD",
  "BKASH",
  "BANK_TRANSFER",
  "CARD",
  "MANUAL",
];
