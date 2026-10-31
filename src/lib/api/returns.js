import { backendRequest, withQuery } from "./http";

/**
 * Returns module — customer-scoped + admin endpoints.
 * @see backend src/modules/returns/return.routes.js, adminReturn.routes.js
 */

/**
 * GET /orders/:orderId/returns — the current customer's returns for an order.
 * CUSTOMER only.
 */
export async function getMyReturns(orderId) {
  return backendRequest(`/orders/${encodeURIComponent(orderId)}/returns`);
}

/**
 * GET /orders/:orderId/returns/:returnId — a single return. CUSTOMER only.
 */
export async function getMyReturn(orderId, returnId) {
  return backendRequest(
    `/orders/${encodeURIComponent(orderId)}/returns/${encodeURIComponent(returnId)}`
  );
}

/**
 * POST /orders/:orderId/returns — create a return request. CUSTOMER only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function createReturn(orderId, body) {
  return backendRequest(`/orders/${encodeURIComponent(orderId)}/returns`, {
    method: "POST",
    body,
  });
}

/**
 * POST /orders/:orderId/returns/:returnId/cancel — cancel a return request.
 * CUSTOMER only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function cancelMyReturn(orderId, returnId) {
  return backendRequest(
    `/orders/${encodeURIComponent(orderId)}/returns/${encodeURIComponent(returnId)}/cancel`,
    { method: "POST" }
  );
}

/**
 * GET /admin/returns — paginated return list. ADMIN/STAFF only.
 * @param {object} [params] status, returnNumber, orderNumber, dateFrom, dateTo, page, limit
 */
export async function getAdminReturns(params) {
  return backendRequest(withQuery("/admin/returns", params));
}

/**
 * GET /admin/returns/:id — single return. ADMIN/STAFF only.
 */
export async function getAdminReturn(id) {
  return backendRequest(`/admin/returns/${encodeURIComponent(id)}`);
}

/**
 * POST /admin/returns/:id/approve — approve a return. ADMIN/STAFF only.
 * Accepts an optional `note` (≤ 500 chars). The acting staff/admin id always
 * comes from the session.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function approveReturn(id, note) {
  return backendRequest(`/admin/returns/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/returns/:id/reject — reject a return. ADMIN/STAFF only.
 * Accepts an optional `note` (≤ 500 chars). Terminal.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function rejectReturn(id, note) {
  return backendRequest(`/admin/returns/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/returns/:id/complete — complete a return; restocks items and
 * auto-creates a refund in one transaction. ADMIN/STAFF only.
 * Accepts an optional `note` (≤ 500 chars).
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function completeReturn(id, note) {
  return backendRequest(`/admin/returns/${encodeURIComponent(id)}/complete`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/returns/:id/cancel — cancel a return. ADMIN/STAFF only.
 * Accepts an optional `note` (≤ 500 chars). Terminal.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function cancelReturn(id, note) {
  return backendRequest(`/admin/returns/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: note ? { note } : {},
  });
}
