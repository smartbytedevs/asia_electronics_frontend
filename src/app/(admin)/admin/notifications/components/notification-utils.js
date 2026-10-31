/**
 * Notification presentation helpers for the admin list/detail UI.
 *
 * The backend admin serializer (notification.serializer.js) exposes exactly:
 * `{ id, recipient, channel, eventType, templateKey, entityRef, title, message,
 *    status, attempts, lastAttemptAt, lastError, provider, providerRef,
 *    deliveredAt, createdAt, updatedAt }`. The raw `payload` snapshot is never
 * sent, so the pre-rendered `title`/`message` are the primary content.
 *
 * This module decides ONLY how to present that data to a non-technical admin:
 * a friendly icon + tone, and a deep link into the related entity for the two
 * ADMIN dashboard events (new order → the order, new review → the review). The
 * `entityRef` is used purely as the navigation key — it is never rendered as
 * text, matching the rule that internal ids never appear in the UI.
 */

import { formatDateTime } from "@/lib/utils";
import { notificationEventTypeLabel } from "../../components/status-meta";

export const NOTIFICATION_KIND_META = {
  order: {
    icon: "order",
    iconClass: "bg-gold-soft/50 text-gold",
  },
  review: {
    icon: "review",
    iconClass: "bg-amber-100 text-amber-700",
  },
  generic: {
    icon: "generic",
    iconClass: "bg-sand text-mocha",
  },
};

export function notificationKind(notification) {
  const eventType = notification?.eventType;
  if (eventType === "ADMIN_ORDER_PLACED") {
    return NOTIFICATION_KIND_META.order;
  }
  if (eventType === "ADMIN_REVIEW_SUBMITTED") {
    return NOTIFICATION_KIND_META.review;
  }
  return NOTIFICATION_KIND_META.generic;
}

/**
 * Deep link into the related entity for the two ADMIN dashboard events.
 * Returns `{ href, label }` or `null` when there is nothing to open. Only
 * ADMIN-channel events get an action; EMAIL-channel records (customer-facing
 * transactional emails) have no admin target page.
 */
export function notificationAction(notification) {
  const eventType = notification?.eventType;
  const entityRef =
    typeof notification?.entityRef === "string" && notification.entityRef !== ""
      ? notification.entityRef
      : null;
  if (eventType === "ADMIN_ORDER_PLACED" && entityRef) {
    return { href: `/admin/orders/${entityRef}`, label: "View order" };
  }
  if (eventType === "ADMIN_REVIEW_SUBMITTED" && entityRef) {
    return { href: `/admin/reviews/${entityRef}`, label: "View review" };
  }
  return null;
}

/**
 * Primary heading. ADMIN events ship a pre-rendered `title`; EMAIL-channel
 * records store the raw business payload instead, so they fall back to the
 * friendly event-type label ("Order placed", "Order confirmed", …) — never the
 * raw event key.
 */
export function notificationTitle(notification) {
  if (typeof notification?.title === "string" && notification.title.trim() !== "") {
    return notification.title;
  }
  return notificationEventTypeLabel(notification?.eventType);
}

/** Short human "when" label: `Received 10 Aug 2026, 14:05`. Null-safe. */
export function notificationTimeLabel(notification, { prefix = "Received" } = {}) {
  const at = notification?.createdAt;
  if (!at) {
    return null;
  }
  return `${prefix} ${formatDateTime(at)}`;
}
