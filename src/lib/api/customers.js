import { backendRequest, withQuery } from "./http";

/**
 * Customers module — ADMIN read surface over the application User collection.
 * @see backend src/modules/users/adminCustomer.routes.js
 */

/**
 * GET /admin/customers — paginated application-user list. ADMIN only.
 * Backend-supported query params: role (ADMIN|STAFF|CUSTOMER),
 * status (ACTIVE|SUSPENDED|DISABLED), page, limit. Each customer is
 * `{ id, email, displayName, phone, role, status, createdAt, updatedAt }`.
 * @param {object} [params]
 */
export async function getAdminCustomers(params) {
  return backendRequest(withQuery("/admin/customers", params));
}

/**
 * GET /admin/customers/:id — single application user (admin view). ADMIN only.
 * @param {string} id
 */
export async function getAdminCustomer(id) {
  return backendRequest(`/admin/customers/${encodeURIComponent(id)}`);
}
