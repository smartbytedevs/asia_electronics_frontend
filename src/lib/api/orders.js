import { backendRequest, withQuery } from "./http";

/**
 * Orders module — customer-scoped + admin endpoints.
 * @see backend src/modules/orders/order.routes.js, adminOrder.routes.js
 */

/**
 * POST /orders/checkout — place an order from the customer's cart.
 * CUSTOMER only. Requires the `Idempotency-Key` header; returns 201 on first
 * completion and 200 on retries.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function checkoutOrder(body, idempotencyKey) {
  return backendRequest("/orders/checkout", {
    method: "POST",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

/**
 * GET /orders/status — PUBLIC order-status lookup for guests. Requires the
 * delivery phone AND exactly one of orderId/orderNumber (this wrapper sends
 * the order number). A wrong phone or unknown order resolves as the same 404
 * ORDER_NOT_FOUND, so existence is never leaked. Goes through the BFF proxy,
 * which whitelists this path for anonymous GETs.
 * @param {object} input { orderNumber, phone }
 */
export async function getOrderStatus({ orderNumber, phone } = {}) {
  return backendRequest(
    withQuery("/orders/status", {
      orderNumber: orderNumber?.trim(),
      phone: phone?.trim(),
    })
  );
}

/**
 * GET /orders — the current customer's orders. CUSTOMER only.
 * @param {object} [params] page, limit
 */
export async function getMyOrders(params) {
  return backendRequest(withQuery("/orders", params));
}

/**
 * GET /orders/:id — a single order owned by the current customer. CUSTOMER only.
 */
export async function getMyOrder(id) {
  return backendRequest(`/orders/${encodeURIComponent(id)}`);
}

/**
 * POST /orders/:id/cancel — cancel an order. CUSTOMER only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function cancelMyOrder(id) {
  return backendRequest(`/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
  });
}

/**
 * GET /admin/orders — paginated order list. ADMIN/STAFF only.
 * @param {object} [params] status, customerId, page, limit
 */
export async function getAdminOrders(params) {
  return backendRequest(withQuery("/admin/orders", params));
}

/**
 * GET /admin/orders/:id — single order. ADMIN/STAFF only.
 */
export async function getAdminOrder(id) {
  return backendRequest(`/admin/orders/${encodeURIComponent(id)}`);
}

/**
 * POST /admin/orders/:id/confirm — confirm a PENDING order. ADMIN/STAFF only.
 * Accepts an optional `note` (≤ 500 chars) recorded in the status history.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function confirmOrder(id, note) {
  return backendRequest(`/admin/orders/${encodeURIComponent(id)}/confirm`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/orders/:id/ship — move a DISPATCHED order to SHIPPED.
 * ADMIN/STAFF only. Accepts an optional `note` recorded in the status history.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function shipOrder(id, note) {
  return backendRequest(`/admin/orders/${encodeURIComponent(id)}/ship`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/orders/:id/deliver — move a SHIPPED order to DELIVERED.
 * ADMIN/STAFF only. Consumes the order's reservations. Accepts an optional
 * `note` recorded in the status history.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function deliverOrder(id, note) {
  return backendRequest(`/admin/orders/${encodeURIComponent(id)}/deliver`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/orders/:id/complete — move a DELIVERED order to COMPLETED.
 * ADMIN/STAFF only. Accepts an optional `note` recorded in the status history.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function completeOrder(id, note) {
  return backendRequest(`/admin/orders/${encodeURIComponent(id)}/complete`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/orders/:id/return — move a SHIPPED order to RETURNED. ADMIN/STAFF
 * only. Terminal; releases the order's reservations. Accepts an optional
 * `note` recorded in the status history.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function returnOrder(id, note) {
  return backendRequest(`/admin/orders/${encodeURIComponent(id)}/return`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/orders/:id/cancel — cancel a pre-delivery order (PENDING /
 * CONFIRMED / PROCESSING / DISPATCHED / SHIPPED). ADMIN/STAFF only. Terminal.
 * Releases the order's reservations and cancels any courier shipment
 * best-effort. Accepts an optional `note` recorded in the status history.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function cancelOrder(id, note) {
  return backendRequest(`/admin/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/orders/:id/reject — reject a PENDING order. ADMIN/STAFF only.
 * Terminal. Releases the order's reservations. Accepts an optional `note`
 * recorded in the status history.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function rejectOrder(id, note) {
  return backendRequest(`/admin/orders/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: note ? { note } : {},
  });
}
