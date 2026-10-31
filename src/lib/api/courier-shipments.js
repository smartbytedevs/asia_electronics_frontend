import { backendRequest, withQuery } from "./http";

/**
 * Courier/shipments module.
 * @see backend src/modules/courier/courier.routes.js
 */

/**
 * GET /admin/shipments — paginated shipment list. ADMIN/STAFF only.
 * @param {object} [params] status, orderId, page, limit
 */
export async function getAdminShipments(params) {
  return backendRequest(withQuery("/admin/shipments", params));
}

/**
 * GET /admin/shipments/:shipmentId — single shipment. ADMIN/STAFF only.
 */
export async function getAdminShipment(shipmentId) {
  return backendRequest(`/admin/shipments/${encodeURIComponent(shipmentId)}`);
}

/**
 * GET /orders/:orderId/tracking — the current customer's tracking for an order.
 * CUSTOMER only.
 */
export async function getOrderTracking(orderId) {
  return backendRequest(
    `/orders/${encodeURIComponent(orderId)}/tracking`
  );
}

/**
 * POST /admin/orders/:orderId/courier/dispatch — dispatch an order to the
 * courier. ADMIN/STAFF only. Accepts an optional `note` (≤ 500 chars).
 * Idempotent for ACTIVE / CANCELLATION_FAILED; DELIVERED / CANCELLED → 409.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function dispatchShipment(orderId, note) {
  return backendRequest(
    `/admin/orders/${encodeURIComponent(orderId)}/courier/dispatch`,
    { method: "POST", body: note ? { note } : {} }
  );
}

/**
 * POST /admin/shipments/:shipmentId/retry — retry a failed dispatch.
 * ADMIN/STAFF only. Only FAILED shipments can be retried. Accepts an optional
 * `note` (≤ 500 chars).
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function retryDispatch(shipmentId, note) {
  return backendRequest(
    `/admin/shipments/${encodeURIComponent(shipmentId)}/retry`,
    { method: "POST", body: note ? { note } : {} }
  );
}

/**
 * POST /admin/shipments/:shipmentId/cancel — cancel a shipment. ADMIN/STAFF only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function cancelShipment(shipmentId) {
  return backendRequest(
    `/admin/shipments/${encodeURIComponent(shipmentId)}/cancel`,
    { method: "POST" }
  );
}

/**
 * NOTE: POST /webhooks/pathao is a public, signed courier webhook — not part
 * of the frontend API surface. It is intentionally not exposed here.
 */
