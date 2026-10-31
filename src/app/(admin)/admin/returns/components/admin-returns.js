"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAdminReturns } from "@/lib/api/returns";
import { safeMessage } from "@/lib/api/http";
import { RETURN_STATUS_OPTIONS, returnStatusMeta } from "../../components/status-meta";
import { Pagination } from "../../components/pagination";
import { TableSkeleton } from "../../components/table-skeleton";
import { ReturnTable } from "./return-table";
import { ReturnCard } from "./return-card";

const PAGE_LIMIT = 20;
const EASE = [0.22, 1, 0.36, 1];

const EMPTY_DRAFTS = { returnNumber: "", orderNumber: "", dateFrom: "", dateTo: "" };

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const solidButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-mocha px-4 text-sm font-medium text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Admin return list. Supports exactly the backend's list query — status,
 * returnNumber, orderNumber, dateFrom, dateTo, page, limit. Draft values are
 * applied explicitly so typing never fires a request. Return actions
 * (approve/reject/complete/cancel) refresh the list on success.
 */
export function AdminReturns() {
  const [status, setStatus] = useState("ALL");
  const [draft, setDraft] = useState(EMPTY_DRAFTS);
  const [applied, setApplied] = useState(EMPTY_DRAFTS);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    returns: [],
    pagination: null,
  });

  const invalidDates =
    draft.dateFrom !== "" && draft.dateTo !== "" && draft.dateFrom > draft.dateTo;

  const hasFilters =
    status !== "ALL" ||
    applied.returnNumber !== "" ||
    applied.orderNumber !== "" ||
    applied.dateFrom !== "" ||
    applied.dateTo !== "";

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      returns: prev.returns,
      pagination: prev.pagination,
    }));
  }

  function handleApply() {
    if (invalidDates) {
      return;
    }
    setApplied({ ...draft });
    setPage(1);
    startLoading();
  }

  function handleStatusChange(next) {
    setStatus(next);
    setPage(1);
    startLoading();
  }

  function handleReset() {
    setStatus("ALL");
    setDraft(EMPTY_DRAFTS);
    setApplied(EMPTY_DRAFTS);
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
    const params = { page, limit: PAGE_LIMIT };
    if (status !== "ALL") {
      params.status = status;
    }
    if (applied.returnNumber) {
      params.returnNumber = applied.returnNumber;
    }
    if (applied.orderNumber) {
      params.orderNumber = applied.orderNumber;
    }
    if (applied.dateFrom) {
      params.dateFrom = applied.dateFrom;
    }
    if (applied.dateTo) {
      params.dateTo = applied.dateTo;
    }
    getAdminReturns(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          returns: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        returns: Array.isArray(data?.returns) ? data.returns : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [status, applied, page, reloadKey]);

  const { status: viewStatus, message, returns, pagination } = fetchState;

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
                {RETURN_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {returnStatusMeta(value).label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Return number
              <input
                type="text"
                value={draft.returnNumber}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, returnNumber: event.target.value }))
                }
                placeholder="e.g. RET-000123"
                className={`${controlClass} w-40`}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Order number
              <input
                type="text"
                value={draft.orderNumber}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, orderNumber: event.target.value }))
                }
                placeholder="e.g. ORD-000123"
                className={`${controlClass} w-40`}
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
            <h2 className="font-display text-lg text-ink">Returns unavailable</h2>
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

        {viewStatus === "ready" && returns.length === 0 ? (
          <div className="rounded-2xl border border-gold-soft/70 bg-cream p-10 text-center">
            <p className="text-sm text-muted">
              {hasFilters
                ? "No returns match the selected filters."
                : "No return requests yet."}
            </p>
          </div>
        ) : null}

        {viewStatus === "ready" && returns.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            <ReturnTable
              returns={returns}
              onChanged={handleRefresh}
              className="hidden md:block"
            />
            <div className="space-y-4 md:hidden">
              {returns.map((item) => (
                <ReturnCard key={item.id} returnItem={item} onChanged={handleRefresh} />
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </motion.div>
        ) : null}
      </div>
  );
}
