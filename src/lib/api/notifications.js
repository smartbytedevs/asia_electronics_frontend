import { backendRequest, withQuery } from "./http";

/**
 * Notifications module — ADMIN read-only audit surface.
 *
 * Delivery is internal-only (Phase 11): business services trigger
 * notifications via `maybeNotify`; there is no customer notification center,
 * no mark-as-read, and no write endpoint. The only HTTP routes are the ADMIN
 * read list/detail over the Notification collection.
 * @see backend src/modules/notifications/adminNotification.routes.js
 */

/**
 * GET /admin/notifications — paginated notification list. ADMIN only.
 * Backend-supported query params: status (QUEUED|SENT|FAILED|SKIPPED),
 * eventType (one of the Phase 11 event types), page, limit. Each notification
 * is `{ id, recipient, channel, eventType, templateKey, entityRef, status,
 * attempts, lastAttemptAt, lastError, provider, providerRef, deliveredAt,
 * createdAt, updatedAt }` — the internal `payload` snapshot is never sent.
 * @param {object} [params]
 */
export async function getAdminNotifications(params) {
  return backendRequest(withQuery("/admin/notifications", params));
}

/**
 * GET /admin/notifications/:id — single notification (admin view). ADMIN only.
 * @param {string} id
 */
export async function getAdminNotification(id) {
  return backendRequest(`/admin/notifications/${encodeURIComponent(id)}`);
}
