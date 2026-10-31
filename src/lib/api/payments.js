import { backendRequest, withQuery } from "./http";

/**
 * Payments module — customer payments, payment methods, admin payments.
 * @see backend src/modules/payments/*.routes.js
 */

/**
 * GET /orders/:orderId/payment — the current customer's payment for an order.
 * CUSTOMER only.
 */
export async function getMyPayment(orderId) {
  return backendRequest(
    `/orders/${encodeURIComponent(orderId)}/payment`
  );
}

/**
 * POST /orders/:orderId/payment — submit a payment proof (multipart).
 * CUSTOMER only; requires the `Idempotency-Key` header and the proof file
 * uploaded as multipart form data. Not exercised by the JSON API testing page.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function submitPayment(orderId, formData, idempotencyKey) {
  return backendRequest(`/orders/${encodeURIComponent(orderId)}/payment`, {
    method: "POST",
    body: formData,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

/**
 * GET /payment-methods — active payment methods with transfer instructions.
 * CUSTOMER only.
 */
export async function getPaymentMethods() {
  return backendRequest("/payment-methods");
}

/**
 * GET /admin/payments — paginated payment list. ADMIN/STAFF only.
 * Backend-supported query params: status, paymentMethodId, customerId,
 * orderNumber, dateFrom, dateTo, page, limit.
 * @param {object} [params]
 */
export async function getAdminPayments(params) {
  return backendRequest(withQuery("/admin/payments", params));
}

/**
 * GET /admin/payments/:id — single payment. ADMIN/STAFF only.
 */
export async function getAdminPayment(id) {
  return backendRequest(`/admin/payments/${encodeURIComponent(id)}`);
}

/**
 * POST /admin/payments/:id/verify — verify a SUBMITTED payment. ADMIN/STAFF
 * only. Terminal. Accepts an optional `note` (≤ 500 chars).
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function verifyPayment(id, note) {
  return backendRequest(`/admin/payments/${encodeURIComponent(id)}/verify`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/payments/:id/reject — reject a SUBMITTED payment. ADMIN/STAFF
 * only. Mutable via customer resubmission. Accepts an optional `note`
 * (≤ 500 chars).
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function rejectPayment(id, note) {
  return backendRequest(`/admin/payments/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * NOTE: there is no GET list endpoint for payment methods in admin.
 * Management is write-only: POST /admin/payment-methods and
 * PATCH /admin/payment-methods/:id (both ADMIN only, excluded from the
 * read-only API testing phase).
 */
