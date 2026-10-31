"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { getAdminPayments } from "@/lib/api/payments";
import { safeMessage } from "@/lib/api/http";
import {
  PAYMENT_STATUS_OPTIONS,
  paymentStatusMeta,
} from "../../components/status-meta";
import { Pagination } from "../../components/pagination";
import { TableSkeleton } from "../../components/table-skeleton";
import { PaymentTable } from "./payment-table";
import { PaymentCard } from "./payment-card";

const PAGE_LIMIT = 20;
const EASE = [0.22, 1, 0.36, 1];

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const solidButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-mocha px-4 text-sm font-medium text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const EMPTY_APPLIED = { orderNumber: "", dateFrom: "", dateTo: "" };

/**
 * Admin payment list. Uses only the backend-supported filters (status,
 * orderNumber, dateFrom, dateTo, page, limit). Status applies immediately;
 * the order-number/date fields are drafts applied explicitly so a half-typed
 * search never fires a request. Reset clears every filter. SUBMITTED rows get
 * the verify/reject workflow via PaymentActions.
 */
export function AdminPayments() {
  const [status, setStatus] = useState("ALL");
  const [draft, setDraft] = useState(EMPTY_APPLIED);
  const [applied, setApplied] = useState(EMPTY_APPLIED);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    payments: [],
    pagination: null,
  });

  const params = useMemo(() => {
    const query = { page, limit: PAGE_LIMIT };
    if (status !== "ALL") {
      query.status = status;
    }
    if (applied.orderNumber) {
      query.orderNumber = applied.orderNumber;
    }
    if (applied.dateFrom) {
      query.dateFrom = applied.dateFrom;
    }
    if (applied.dateTo) {
      query.dateTo = applied.dateTo;
    }
    return query;
  }, [status, applied, page]);

  const invalidDates =
    draft.dateFrom !== "" &&
    draft.dateTo !== "" &&
    draft.dateFrom > draft.dateTo;

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      payments: prev.payments,
      pagination: prev.pagination,
    }));
  }

  function handleStatusChange(next) {
    setStatus(next);
    setPage(1);
    startLoading();
  }

  function handleApply() {
    if (invalidDates) {
      return;
    }
    setApplied({ ...draft });
    setPage(1);
    startLoading();
  }

  function handleReset() {
    setStatus("ALL");
    setDraft(EMPTY_APPLIED);
    setApplied(EMPTY_APPLIED);
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
    getAdminPayments(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          payments: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        payments: Array.isArray(data?.payments) ? data.payments : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [params, reloadKey]);

  const { status: viewStatus, message, payments, pagination } = fetchState;
  const hasFilters =
    status !== "ALL" ||
    applied.orderNumber !== "" ||
    applied.dateFrom !== "" ||
    applied.dateTo !== "";

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
                {PAYMENT_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {paymentStatusMeta(value).label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Order number
              <input
                type="text"
                value={draft.orderNumber}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, orderNumber: event.target.value }))
                }
                placeholder="e.g. TAQ-000123"
                className={`${controlClass} w-44`}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              From
              <input
                type="date"
                value={draft.dateFrom}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, dateFrom: event.target.value }))
                }
                className={controlClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              To
              <input
                type="date"
                value={draft.dateTo}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, dateTo: event.target.value }))
                }
                className={controlClass}
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApply}
                disabled={invalidDates}
                className={`${solidButtonClass} disabled:pointer-events-none disabled:opacity-50`}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleReset}
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

          {invalidDates ? (
            <p className="mt-3 text-sm text-[#c9604d]">
              The start date must be on or before the end date.
            </p>
          ) : null}
        </div>

        {viewStatus === "loading" ? <TableSkeleton rows={6} /> : null}

        {viewStatus === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Payments unavailable</h2>
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

        {viewStatus === "ready" && payments.length === 0 ? (
          <div className="rounded-2xl border border-gold-soft/70 bg-cream p-10 text-center">
            <p className="text-sm text-muted">
              {hasFilters
                ? "No payments match the selected filters yet."
                : "No payments have been submitted yet."}
            </p>
          </div>
        ) : null}

        {viewStatus === "ready" && payments.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            <PaymentTable
              payments={payments}
              onChanged={handleRefresh}
              className="hidden md:block"
            />
            <div className="space-y-4 md:hidden">
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onChanged={handleRefresh}
                />
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </motion.div>
        ) : null}
      </div>
  );
}
