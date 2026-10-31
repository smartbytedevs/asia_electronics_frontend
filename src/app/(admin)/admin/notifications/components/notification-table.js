import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { notificationStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { NotificationIcon } from "./notification-icon";
import {
  notificationAction,
  notificationTitle,
} from "./notification-utils";

/**
 * Desktop notification list. Business-first: the primary cell is the
 * human-readable `title`/`message` (the backend pre-renders these from the
 * event payload — the raw payload is never serialized). Internal metadata
 * (event name, template key, recipient, entity, provider refs, attempts) is
 * deliberately absent. The action cell deep-links ADMIN events into the
 * related order/review.
 */
export function NotificationTable({ notifications, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Notification</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Received</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {notifications.map((notification) => {
              const action = notificationAction(notification);
              const time = notification.createdAt
                ? formatDateTime(notification.createdAt)
                : "—";
              return (
                <tr key={notification.id} className="align-top transition-colors hover:bg-gold-soft/20">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <NotificationIcon notification={notification} />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/notifications/${notification.id}`}
                          className="font-medium text-ink underline-offset-2 hover:text-mocha-deep hover:underline"
                        >
                          {notificationTitle(notification)}
                        </Link>
                        {notification.message ? (
                          <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-relaxed text-muted">
                            {notification.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge meta={notificationStatusMeta(notification.status)} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{time}</td>
                  <td className="px-4 py-3 text-right">
                    <ActionCell notification={notification} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionCell({ notification }) {
  const action = notificationAction(notification);
  if (action) {
    return (
      <Link
        href={action.href}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
      >
        {action.label}
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    );
  }
  return (
    <Link
      href={`/admin/notifications/${notification.id}`}
      className="text-xs font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
    >
      View details
    </Link>
  );
}
