"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getAdminNotifications } from "@/lib/api/notifications";
import { safeMessage } from "@/lib/api/http";
import { formatDate } from "@/lib/utils";
import {
  notificationEventTypeLabel,
  notificationStatusMeta,
} from "./status-meta";
import { StatusBadge } from "./status-badge";

const RECENT_LIMIT = 5;
const POLL_MS = 60_000;
const EASE = [0.22, 1, 0.36, 1];
const SEEN_STORAGE_KEY = "taqwa.admin.notifications.seen";
const SEEN_MAX = 500;

const STATUS_DOT = {
  SENT: "bg-emerald-500",
  QUEUED: "bg-amber-400",
  FAILED: "bg-[#c9604d]",
  SKIPPED: "bg-stone-400",
};

function dotFor(status) {
  return STATUS_DOT[status] ?? "bg-gold-soft";
}

function timeAgo(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return "Just now";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return formatDate(value);
}

/**
 * Client-only "seen" tracking for the bell. The backend Notification document
 * has NO read/unread state (and we never fake it), so the unread badge is a
 * pure UI convenience: notifications are marked seen once they have been shown
 * in this popover. It persists in localStorage so the badge survives
 * navigation between admin pages without any backend change.
 */
function loadSeen() {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function persistSeen(seen) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const next = Array.from(seen).slice(-SEEN_MAX);
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode / quota) — the badge just stays on.
  }
}

/**
 * Notification bell in the admin navbar. Pulls the newest notifications from
 * the existing `getAdminNotifications` read API (never creates data) and shows
 * an unread-count badge based on the client-side seen set. Opening the
 * popover marks the listed notifications as seen; the popover links through to
 * the full admin notifications audit page.
 */
export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => new Set());
  const seenLoadedRef = useRef(false);
  const [notifications, setNotifications] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(null);
  const wrapRef = useRef(null);

  const fetchNotifications = useCallback(({ asRefresh }) => {
    if (asRefresh) {
      setStatus("refreshing");
    }
    getAdminNotifications({ page: 1, limit: RECENT_LIMIT }).then((result) => {
      if (!result.ok) {
        setStatus("error");
        setMessage(safeMessage(result.status, result.payload));
        return;
      }
      const data = result.payload?.data ?? null;
      const found = Array.isArray(data?.notifications)
        ? data.notifications
        : [];
      setNotifications(found);
      setStatus("ready");
      setMessage(null);
      if (!seenLoadedRef.current) {
        seenLoadedRef.current = true;
        setSeen(loadSeen());
      }
    });
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(
      () => fetchNotifications({ asRefresh: false }),
      0,
    );
    const timer = window.setInterval(
      () => fetchNotifications({ asRefresh: true }),
      POLL_MS,
    );
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onPointerDown(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const markCurrentSeen = useCallback(() => {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return;
    }
    setSeen((previous) => {
      const next = new Set(previous);
      let changed = false;
      for (const notification of notifications) {
        if (notification?.id && !next.has(notification.id)) {
          next.add(notification.id);
          changed = true;
        }
      }
      if (changed) {
        persistSeen(next);
      }
      return next;
    });
  }, [notifications]);

  const unreadCount = useMemo(() => {
    if (!Array.isArray(notifications)) {
      return 0;
    }
    return notifications.filter((notification) => !seen.has(notification.id))
      .length;
  }, [notifications, seen]);

  const badge =
    unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : null;

  function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    fetchNotifications({ asRefresh: true });
    markCurrentSeen();
  }

  function handleRetry() {
    setStatus("loading");
    setMessage(null);
    fetchNotifications({ asRefresh: false });
  }

  return (
      <div className="relative" ref={wrapRef}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          aria-label={open ? "Close notifications" : "Open notifications"}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={handleToggle}
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 ${
            open
              ? "border-gold/60 bg-gold-soft/60 text-mocha-deep"
              : "border-gold-soft bg-white text-mocha hover:border-gold/50 hover:bg-gold-soft/40 hover:text-mocha-deep"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <AnimatePresence>
            {badge ? (
              <motion.span
                key="badge"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c9604d] px-1 text-[10px] font-semibold leading-none text-white shadow-sm"
              >
                {badge}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {open ? (
            <motion.div
              role="dialog"
              aria-label="Recent notifications"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="absolute right-0 top-full z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream shadow-[0_24px_60px_-24px_rgba(43,38,32,0.35)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-gold-soft/40 px-4 py-3">
                <p className="font-display text-base text-ink">
                  Notifications
                </p>
                {badge ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-[#c9604d]">
                    {unreadCount} new
                  </span>
                ) : null}
              </div>

              <div className="max-h-[24rem] overflow-y-auto">
                {status === "loading" || status === "refreshing" ? (
                  <NotificationSkeleton rows={RECENT_LIMIT} />
                ) : null}

                {status === "error" ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-mocha-deep">{message}</p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-gold-soft bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      Try again
                    </button>
                  </div>
                ) : null}

                {status === "ready" &&
                (!Array.isArray(notifications) ||
                  notifications.length === 0) ? (
                  <p className="px-4 py-10 text-center text-sm text-muted">
                    No notifications yet.
                  </p>
                ) : null}

                {status === "ready" && Array.isArray(notifications) ? (
                  <ul className="divide-y divide-gold-soft/40">
                    {notifications.map((notification) => {
                      const unread = !seen.has(notification.id);
                      return (
                        <li key={notification.id}>
                          <Link
                            href={`/admin/notifications/${notification.id}`}
                            onClick={() => setOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gold-soft/25 ${
                              unread ? "bg-gold-soft/20" : ""
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                unread ? "bg-[#c9604d]" : dotFor(notification.status)
                              }`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">
                                {notificationEventTypeLabel(
                                  notification.eventType,
                                )}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted">
                                {notification.entityRef || "No entity"} ·{" "}
                                {timeAgo(notification.createdAt)}
                              </span>
                            </span>
                            <span className="shrink-0">
                              <StatusBadge
                                meta={notificationStatusMeta(
                                  notification.status,
                                )}
                              />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>

              <div className="border-t border-gold-soft/40 bg-sand/50 px-4 py-3">
                <Link
                  href="/admin/notifications"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-mocha-deep underline-offset-2 transition-colors hover:bg-gold-soft/40 hover:text-ink hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
  );
}

function NotificationSkeleton({ rows }) {
  return (
    <div aria-hidden="true" className="px-4 py-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-gold-soft" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-gold-soft/70" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-sand" />
          </div>
          <div className="h-5 w-16 shrink-0 animate-pulse rounded-full bg-gold-soft/60" />
        </div>
      ))}
    </div>
  );
}
