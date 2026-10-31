import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { notificationStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { NotificationIcon } from "./notification-icon";
import { notificationAction, notificationTitle } from "./notification-utils";

/**
 * Mobile notification card — the same business-first fields as the desktop
 * table, laid out for small screens: title + message, status badge, received
 * time, and a deep link into the related order/review when available.
 */
export function NotificationCard({ notification }) {
  const action = notificationAction(notification);
  const time = notification.createdAt
    ? formatDateTime(notification.createdAt)
    : "—";
  return (
    <article className="group rounded-2xl border border-gold-soft/70 bg-cream p-4 transition-colors hover:border-gold-soft">
      <div className="flex items-start gap-3">
        <NotificationIcon notification={notification} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/admin/notifications/${notification.id}`}
              className="font-medium text-ink underline-offset-2 hover:text-mocha-deep hover:underline"
            >
              {notificationTitle(notification)}
            </Link>
            <StatusBadge meta={notificationStatusMeta(notification.status)} />
          </div>
          {notification.message ? (
            <p className="mt-1 text-sm leading-relaxed text-mocha-deep">
              {notification.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gold-soft/40 pt-3">
        <p className="text-xs tabular-nums text-muted">Received {time}</p>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30"
          >
            {action.label}
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <Link
            href={`/admin/notifications/${notification.id}`}
            className="text-xs font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
          >
            View details
          </Link>
        )}
      </div>
    </article>
  );
}
