import { backendRequest, withQuery } from "./http";

/**
 * Reservations module. All endpoints are ADMIN-only.
 * @see backend src/modules/inventory/inventory.routes.js
 */

/**
 * GET /inventory/reservations — paginated reservation list.
 * @param {object} [params] status, productVariantId, page, limit
 */
export async function getReservations(params) {
  return backendRequest(withQuery("/inventory/reservations", params));
}

/**
 * GET /inventory/reservations/:id — single reservation.
 */
export async function getReservation(id) {
  return backendRequest(`/inventory/reservations/${encodeURIComponent(id)}`);
}

/**
 * POST /inventory/reservations — create a reservation. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function createReservation(body) {
  return backendRequest("/inventory/reservations", { method: "POST", body });
}

/**
 * POST /inventory/reservations/:id/release — release a reservation. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function releaseReservation(id) {
  return backendRequest(
    `/inventory/reservations/${encodeURIComponent(id)}/release`,
    { method: "POST" }
  );
}

/**
 * POST /inventory/reservations/:id/consume — consume a reservation. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function consumeReservation(id) {
  return backendRequest(
    `/inventory/reservations/${encodeURIComponent(id)}/consume`,
    { method: "POST" }
  );
}

/**
 * POST /inventory/reservations/:id/expire — expire a reservation. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function expireReservation(id) {
  return backendRequest(
    `/inventory/reservations/${encodeURIComponent(id)}/expire`,
    { method: "POST" }
  );
}
