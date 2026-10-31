"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { getAdminNotification } from "@/lib/api/notifications";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime } from "@/lib/utils";
import { notificationStatusMeta } from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { NotificationIcon } from "../../components/notification-icon";
import {
  notificationAction,
  notificationTimeLabel,
  notificationTitle,
} from "../../components/notification-utils";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Friendly delivery note for non-SENT statuses. The raw provider error /
 * attempts / provider refs are deliberately hidden — a non-technical admin
 * only needs to know whether the message got through.
 */
function deliveryNote(status) {
  switch (status) {
    case "FAILED":
      return "This notification could not be delivered.";
    case "SKIPPED":
      return "This notification was skipped and was not delivered.";
    case "QUEUED":
      return "This notification is waiting to be delivered.";
    default:
      return null;
  }
}

/**
 * Single notification from `GET /admin/notifications/:id`. Business-first:
 * the pre-rendered `title`/`message` are the content; ADMIN events get a
 * prominent deep link into the related order/review. Nothing internal is shown
 * — no event name, template key, recipient, entity, provider, provider ref,
 * attempts, or raw ids.
 */
export function NotificationDetail({ notificationId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    notification: null,
  });

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      notification: prev.notification,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminNotification(notificationId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          notification: null,
        });
        return;
      }
      setFetchState({
        status: "ready",
        message: null,
        notification: result.payload?.data?.notification ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [notificationId, reloadKey]);

  const { status, message, notification } = fetchState;

  if (status === "loading") {
    return (
      <div aria-hidden="true" className="space-y-4">
        <div className="h-28 skeleton-shimmer rounded-2xl" />
        <div className="h-40 skeleton-shimmer rounded-2xl" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
      >
        <h2 className="font-display text-lg text-ink">Notification unavailable</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">
          {message}
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!notification) {
    return null;
  }

  const action = notificationAction(notification);
  const timeLabel = notificationTimeLabel(notification) ?? "—";
  const note = deliveryNote(notification.status);
  const updatedAt =
    notification.updatedAt && notification.updatedAt !== notification.createdAt
      ? notification.updatedAt
      : null;

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/admin/notifications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to notifications
        </Link>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <NotificationIcon notification={notification} className="h-12 w-12" />
              <div>
                <h2 className="font-display text-2xl leading-tight text-ink">
                  {notificationTitle(notification)}
                </h2>
                <p className="mt-1 text-sm text-muted">{timeLabel}</p>
              </div>
            </div>
            <StatusBadge meta={notificationStatusMeta(notification.status)} />
          </div>

          {notification.message ? (
            <p className="mt-5 rounded-xl border border-gold-soft/50 bg-sand/50 px-4 py-3.5 text-sm leading-relaxed text-mocha-deep sm:px-5">
              {notification.message}
            </p>
          ) : null}

          {note ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-sm leading-relaxed text-amber-800">
              {note}
            </p>
          ) : null}

          {action ? (
            <div className="mt-5 border-t border-gold-soft/40 pt-5">
              <Link
                href={action.href}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {action.label}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <h2 className="font-display text-lg text-ink">About this notification</h2>
          <dl className="mt-3 divide-y divide-gold-soft/30">
            <DetailRow label="Received">{timeLabel}</DetailRow>
            {updatedAt ? (
              <DetailRow label="Updated">
                {formatDateTime(updatedAt)}
              </DetailRow>
            ) : null}
            <DetailRow label="Status">
              <StatusBadge meta={notificationStatusMeta(notification.status)} />
            </DetailRow>
          </dl>
        </section>
      </motion.div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}
