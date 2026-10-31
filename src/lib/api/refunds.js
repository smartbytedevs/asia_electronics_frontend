import { backendRequest, withQuery } from "./http";

/**
 * Refunds module — admin only.
 * @see backend src/modules/refunds/refund.routes.js
 */

/**
 * GET /admin/refunds — paginated refund list. ADMIN/STAFF only.
 * @param {object} [params] status, refundNumber, dateFrom, dateTo, page, limit
 */
export async function getAdminRefunds(params) {
  return backendRequest(withQuery("/admin/refunds", params));
}

/**
 * GET /admin/refunds/:id — single refund. ADMIN/STAFF only.
 */
export async function getAdminRefund(id) {
  return backendRequest(`/admin/refunds/${encodeURIComponent(id)}`);
}

/**
 * POST /admin/refunds/:id/process — payout a PENDING refund (requires the
 * linked return to be COMPLETED). ADMIN/STAFF only. Accepts an optional
 * `note` (≤ 500 chars).
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function processRefund(id, note) {
  return backendRequest(`/admin/refunds/${encodeURIComponent(id)}/process`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/refunds/:id/void — void a PENDING refund. ADMIN/STAFF only.
 * Accepts an optional `note` (≤ 500 chars). Terminal.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function voidRefund(id, note) {
  return backendRequest(`/admin/refunds/${encodeURIComponent(id)}/void`, {
    method: "POST",
    body: note ? { note } : {},
  });
}
