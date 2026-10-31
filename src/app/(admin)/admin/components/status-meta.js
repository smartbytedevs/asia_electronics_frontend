/**
 * Status metadata derived from the backend contracts:
 * - Orders: order.constants.js (REACHABLE_ORDER_STATUSES) + the state machine
 *   (PENDING → CONFIRMED → DISPATCHED → SHIPPED → DELIVERED → COMPLETED, with
 *   terminal REJECTED / CANCELLED branches and SHIPPED → RETURNED). PROCESSING
 *   is retained for data compatibility — the backend still persists it — but
 *   the admin UI drives the lifecycle without it.
 * - Payments: payment.constants.js (REACHABLE_PAYMENT_STATUSES).
 *
 * Only statuses the backend actually persists are listed, so the filter
 * dropdowns and badges never offer an invented state. The option order mirrors
 * the forward lifecycle so the admin filter reads top-to-bottom like the
 * status timeline.
 */

export const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "DISPATCHED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "RETURNED",
  "CANCELLED",
  "REJECTED",
];

const ORDER_STATUS_META = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  CONFIRMED: { label: "Confirmed", className: "bg-gold-soft/60 text-mocha-deep border-gold-soft" },
  PROCESSING: { label: "Processing", className: "bg-mocha/10 text-mocha border-mocha/25" },
  DISPATCHED: { label: "Dispatched", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  SHIPPED: { label: "Shipped", className: "bg-sky-50 text-sky-700 border-sky-200" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  CANCELLED: { label: "Cancelled", className: "bg-stone-100 text-stone-600 border-stone-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-[#c9604d] border-red-200" },
  RETURN_REQUESTED: { label: "Return requested", className: "bg-rose-50 text-rose-600 border-rose-200" },
  RETURNED: { label: "Returned", className: "bg-rose-50 text-rose-600 border-rose-200" },
};

export const REVIEW_STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];

const REVIEW_STATUS_META = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-[#c9604d] border-red-200" },
};

export const PAYMENT_STATUS_OPTIONS = ["SUBMITTED", "VERIFIED", "REJECTED"];

const PAYMENT_STATUS_META = {
  SUBMITTED: { label: "Submitted", className: "bg-amber-100 text-amber-800 border-amber-200" },
  VERIFIED: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-[#c9604d] border-red-200" },
  UNPAID: { label: "Unpaid", className: "bg-stone-100 text-stone-500 border-stone-200" },
};

function metaFor(table, status) {
  const meta = table[status];
  if (meta) {
    return meta;
  }
  const label = status
    ? status.charAt(0) + status.slice(1).toLowerCase()
    : "Unknown";
  return {
    label,
    className: "bg-sand text-mocha border-gold-soft/60",
  };
}

export function orderStatusMeta(status) {
  return metaFor(ORDER_STATUS_META, status);
}

export function paymentStatusMeta(status) {
  return metaFor(PAYMENT_STATUS_META, status);
}

export function reviewStatusMeta(status) {
  return metaFor(REVIEW_STATUS_META, status);
}

/**
 * Account statuses for the admin customer surface
 * (backend src/constants/index.js: ACCOUNT_STATUSES).
 */
export const ACCOUNT_STATUS_OPTIONS = ["ACTIVE", "SUSPENDED", "DISABLED"];

const ACCOUNT_STATUS_META = {
  ACTIVE: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SUSPENDED: { label: "Suspended", className: "bg-amber-100 text-amber-800 border-amber-200" },
  DISABLED: { label: "Disabled", className: "bg-stone-100 text-stone-600 border-stone-200" },
};

export function accountStatusMeta(status) {
  return metaFor(ACCOUNT_STATUS_META, status);
}

/**
 * Application user roles (backend src/constants/index.js: ROLES).
 */
export const USER_ROLE_OPTIONS = ["ADMIN", "STAFF", "CUSTOMER"];

const USER_ROLE_META = {
  ADMIN: { label: "Admin", className: "bg-mocha/10 text-mocha border-mocha/25" },
  STAFF: { label: "Staff", className: "bg-sky-50 text-sky-700 border-sky-200" },
  CUSTOMER: { label: "Customer", className: "bg-sand text-mocha-deep border-gold-soft/60" },
};

export function userRoleMeta(role) {
  return metaFor(USER_ROLE_META, role);
}

/**
 * Notification delivery statuses
 * (backend notification.constants.js: NOTIFICATION_STATUSES).
 */
export const NOTIFICATION_STATUS_OPTIONS = ["QUEUED", "SENT", "FAILED", "SKIPPED"];

const NOTIFICATION_STATUS_META = {
  QUEUED: { label: "Queued", className: "bg-amber-100 text-amber-800 border-amber-200" },
  SENT: { label: "Sent", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED: { label: "Failed", className: "bg-red-50 text-[#c9604d] border-red-200" },
  SKIPPED: { label: "Skipped", className: "bg-stone-100 text-stone-500 border-stone-200" },
};

export function notificationStatusMeta(status) {
  return metaFor(NOTIFICATION_STATUS_META, status);
}

/**
 * Notification event-type labels (backend notification.constants.js:
 * NOTIFICATION_EVENT_TYPES). Only real event types are listed, so the filter
 * dropdown never offers an invented event.
 */
const NOTIFICATION_EVENT_TYPE_LABELS = {
  ORDER_PLACED: "Order placed",
  ORDER_CONFIRMED: "Order confirmed",
  ORDER_PROCESSING: "Order processing",
  ORDER_REJECTED: "Order rejected",
  ORDER_CANCELLED: "Order cancelled",
  PAYMENT_SUBMITTED: "Payment submitted",
  PAYMENT_VERIFIED: "Payment verified",
  PAYMENT_REJECTED: "Payment rejected",
  SHIPMENT_DISPATCHED: "Shipment dispatched",
  ORDER_DELIVERED: "Order delivered",
  RETURN_REQUESTED: "Return requested",
  RETURN_APPROVED: "Return approved",
  RETURN_REJECTED: "Return rejected",
  RETURN_COMPLETED: "Return completed",
  RETURN_CANCELLED: "Return cancelled",
  REFUND_PROCESSED: "Refund processed",
  REFUND_VOIDED: "Refund voided",
  // Admin dashboard events (ADMIN channel — no email).
  ADMIN_ORDER_PLACED: "New order",
  ADMIN_REVIEW_SUBMITTED: "New review",
  // Legacy email-only event (backend ADMIN_ORDER_PLACED_EMAIL). The backend no
  // longer persists a Notification record for it, but pre-existing rows must
  // still render a friendly label instead of the raw event key. It is kept out
  // of the filter options below because it can no longer be created.
  ADMIN_ORDER_PLACED_EMAIL: "Admin new order email",
};

// Filter dropdown: real, currently-filterable event types. Legacy email-only
// events are excluded so the dropdown never offers an event that can no longer
// be created (their old records still render via the label map above).
export const NOTIFICATION_EVENT_TYPE_OPTIONS = Object.keys(
  NOTIFICATION_EVENT_TYPE_LABELS
).filter((eventType) => eventType !== "ADMIN_ORDER_PLACED_EMAIL");

export function notificationEventTypeLabel(eventType) {
  return NOTIFICATION_EVENT_TYPE_LABELS[eventType] || eventType || "—";
}

/** Return statuses (return.constants.js: RETURN_STATUSES). */
export const RETURN_STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"];

const RETURN_STATUS_META = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  APPROVED: { label: "Approved", className: "bg-gold-soft/60 text-mocha-deep border-gold-soft" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-[#c9604d] border-red-200" },
  COMPLETED: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelled", className: "bg-stone-100 text-stone-600 border-stone-200" },
};

export function returnStatusMeta(status) {
  return metaFor(RETURN_STATUS_META, status);
}

/** Refund statuses (refund.constants.js: REFUND_STATUSES). */
export const REFUND_STATUS_OPTIONS = ["PENDING", "PROCESSED", "VOIDED"];

const REFUND_STATUS_META = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  PROCESSED: { label: "Processed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  VOIDED: { label: "Voided", className: "bg-stone-100 text-stone-500 border-stone-200" },
};

export function refundStatusMeta(status) {
  return metaFor(REFUND_STATUS_META, status);
}

/** Courier shipment statuses (courier.constants.js: COURIER_STATUSES). */
export const COURIER_STATUS_OPTIONS = [
  "PENDING",
  "ACTIVE",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "CANCELLATION_FAILED",
];

const COURIER_STATUS_META = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  ACTIVE: { label: "Active", className: "bg-sky-50 text-sky-700 border-sky-200" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelled", className: "bg-stone-100 text-stone-600 border-stone-200" },
  FAILED: { label: "Failed", className: "bg-red-50 text-[#c9604d] border-red-200" },
  CANCELLATION_FAILED: {
    label: "Cancellation failed",
    className: "bg-red-50 text-[#c9604d] border-red-200",
  },
};

export function courierStatusMeta(status) {
  return metaFor(COURIER_STATUS_META, status);
}

/**
 * Product visibility state from the backend serializer's `isActive` field
 * (product.serializer.js). The admin list is ACTIVE-only (there is no admin
 * list endpoint), so rows always render "Active"; the meta is kept for
 * completeness and future views.
 */
export function productStatusMeta(isActive) {
  return isActive
    ? { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : { label: "Inactive", className: "bg-stone-100 text-stone-500 border-stone-200" };
}

/** Product catalog flag labels (product.constants.js: PRODUCT_FLAGS). */
const PRODUCT_FLAG_LABELS = {
  featured: "Featured",
  newArrival: "New",
  bestDeal: "Best deal",
};

export function productFlagLabel(flag) {
  return PRODUCT_FLAG_LABELS[flag] || flag || null;
}

/** Order payment-method labels (order.constants.js: PAYMENT_METHODS). */
const PAYMENT_METHOD_LABELS = {
  COD: "Cash on delivery",
  MANUAL: "Manual payment",
  BKASH: "bKash",
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card",
};

export function paymentMethodLabel(method) {
  if (PAYMENT_METHOD_LABELS[method]) {
    return PAYMENT_METHOD_LABELS[method];
  }
  return method || "—";
}

/**
 * Inventory stock state, derived from the backend serializer's `isInitialized` /
 * `isLowStock` / `isOutOfStock` flags (inventory.serializer.js). A synthetic
 * "Not initialized" row (active product with no inventory record) wins over
 * every stock state; otherwise out of stock wins over low stock, else the
 * record is in stock. The backend computes these from
 * `availableOnlineQuantity` vs `lowStockThreshold`.
 */
export function inventoryStatusMeta({ isInitialized, isLowStock, isOutOfStock }) {
  if (isInitialized === false) {
    return {
      label: "Not initialized",
      className: "bg-stone-100 text-stone-600 border-stone-200",
    };
  }
  if (isOutOfStock) {
    return { label: "Out of stock", className: "bg-red-50 text-[#c9604d] border-red-200" };
  }
  if (isLowStock) {
    return { label: "Low stock", className: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  return { label: "In stock", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

/** Reservation statuses (inventory.constants.js: RESERVATION_STATUSES). */
export const RESERVATION_STATUS_OPTIONS = ["ACTIVE", "RELEASED", "CONSUMED", "EXPIRED"];

const RESERVATION_STATUS_META = {
  ACTIVE: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RELEASED: { label: "Released", className: "bg-sky-50 text-sky-700 border-sky-200" },
  CONSUMED: { label: "Consumed", className: "bg-mocha/10 text-mocha border-mocha/25" },
  EXPIRED: { label: "Expired", className: "bg-stone-100 text-stone-500 border-stone-200" },
};

export function reservationStatusMeta(status) {
  return metaFor(RESERVATION_STATUS_META, status);
}

/** Stock locations (inventory.constants.js: STOCK_LOCATIONS). */
const STOCK_LOCATION_LABELS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

export function stockLocationLabel(location) {
  if (STOCK_LOCATION_LABELS[location]) {
    return STOCK_LOCATION_LABELS[location];
  }
  return location || "—";
}

/** Ledger movement types (inventory.constants.js: MOVEMENT_TYPES). */
const MOVEMENT_TYPE_LABELS = {
  INITIAL_STOCK: "Initial stock",
  STOCK_IN: "Stock in",
  STOCK_OUT: "Stock out",
  TRANSFER: "Transfer",
  ADJUSTMENT: "Adjustment",
  RESERVATION: "Reserved",
  RESERVATION_RELEASE: "Reservation released",
  RESERVATION_CONSUME: "Reservation consumed",
  RETURN_RESTOCK: "Return restock",
  TRANSFER_OUT: "Transferred out",
  TRANSFER_IN: "Transferred in",
};

export function movementTypeLabel(type) {
  if (MOVEMENT_TYPE_LABELS[type]) {
    return MOVEMENT_TYPE_LABELS[type];
  }
  return type || "—";
}
