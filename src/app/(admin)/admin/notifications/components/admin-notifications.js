"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, X } from "lucide-react";
import { getAdminNotifications } from "@/lib/api/notifications";
import { safeMessage } from "@/lib/api/http";
import {
  NOTIFICATION_EVENT_TYPE_OPTIONS,
  NOTIFICATION_STATUS_OPTIONS,
  notificationEventTypeLabel,
  notificationStatusMeta,
} from "../../components/status-meta";
import { Pagination } from "../../components/pagination";
import { TableSkeleton } from "../../components/table-skeleton";
import { NotificationTable } from "./notification-table";
import { NotificationCard } from "./notification-card";

const PAGE_LIMIT = 20;
const EASE = [0.22, 1, 0.36, 1];

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Admin notification audit list. Filters use only the backend-supported query
 * params (status, eventType, page, limit). Changing a filter resets to page 1
 * so the result set never starts mid-list.
 */
export function AdminNotifications() {
  const [status, setStatus] = useState("ALL");
  const [eventType, setEventType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    notifications: [],
    pagination: null,
  });

  const params = useMemo(() => {
    const query = { page, limit: PAGE_LIMIT };
    if (status !== "ALL") {
      query.status = status;
    }
    if (eventType !== "ALL") {
      query.eventType = eventType;
    }
    return query;
  }, [status, eventType, page]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      notifications: prev.notifications,
      pagination: prev.pagination,
    }));
  }

  function handleStatusChange(next) {
    setStatus(next);
    setPage(1);
    startLoading();
  }

  function handleEventTypeChange(next) {
    setEventType(next);
    setPage(1);
    startLoading();
  }

  function handleResetFilters() {
    setStatus("ALL");
    setEventType("ALL");
    setPage(1);
    startLoading();
  }

  function handlePageChange(next) {
    setPage(next);
    startLoading();
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminNotifications(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          notifications: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        notifications: Array.isArray(data?.notifications) ? data.notifications : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [params, reloadKey]);

  const { status: viewStatus, message, notifications, pagination } = fetchState;
  const hasFilters = status !== "ALL" || eventType !== "ALL";

  return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Status
              <select
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className={controlClass}
              >
                <option value="ALL">All statuses</option>
                {NOTIFICATION_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {notificationStatusMeta(value).label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Type
              <select
                value={eventType}
                onChange={(event) => handleEventTypeChange(event.target.value)}
                className={controlClass}
              >
                <option value="ALL">All types</option>
                {NOTIFICATION_EVENT_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {notificationEventTypeLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasFilters}
                className={`${softButtonClass} disabled:pointer-events-none disabled:opacity-50`}
              >
                Reset
              </button>
              <button type="button" onClick={handleRefresh} className={softButtonClass}>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {viewStatus === "loading" ? <TableSkeleton rows={6} /> : null}

        {viewStatus === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Notifications unavailable</h2>
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
        ) : null}

        {viewStatus === "ready" && notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
              <Bell aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-lg text-ink">
              {hasFilters ? "No notifications match your filters" : "No notifications yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              {hasFilters
                ? "Try a different status or type, or reset the filters."
                : "When customers place orders or submit reviews, a notification will appear here."}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                Reset filters
              </button>
            ) : null}
          </motion.div>
        ) : null}

        {viewStatus === "ready" && notifications.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            <NotificationTable notifications={notifications} className="hidden md:block" />
            <div className="space-y-4 md:hidden">
              <AnimatePresence initial={false}>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: EASE,
                      delay: Math.min(index * 0.04, 0.3),
                    }}
                  >
                    <NotificationCard notification={notification} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </motion.div>
        ) : null}
      </div>
  );
}
