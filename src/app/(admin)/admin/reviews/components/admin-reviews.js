"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { getAdminReviews } from "@/lib/api/reviews";
import { safeMessage } from "@/lib/api/http";
import {
  REVIEW_STATUS_OPTIONS,
  reviewStatusMeta,
} from "../../components/status-meta";
import { Pagination } from "../../components/pagination";
import { TableSkeleton } from "../../components/table-skeleton";
import { ReviewTable } from "./review-table";
import { ReviewCard } from "./review-card";

const PAGE_LIMIT = 20;
const EASE = [0.22, 1, 0.36, 1];

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Review moderation list. Defaults to the PENDING filter so the admin
 * immediately sees reviews needing attention; the status dropdown exposes
 * APPROVED / REJECTED / all. Uses only the backend-supported filters
 * (status, productId, page, limit). Product id is a draft applied explicitly
 * so a half-typed value never fires a request. On moderation success the row
 * refreshes via onChanged; a 409 from a concurrent moderator also refreshes
 * so the list never shows a stale decision.
 */
export function AdminReviews() {
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    reviews: [],
    pagination: null,
  });

  const params = useMemo(() => {
    const query = { page, limit: PAGE_LIMIT };
    if (status !== "ALL") {
      query.status = status;
    }
    return query;
  }, [status, page]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      reviews: prev.reviews,
      pagination: prev.pagination,
    }));
  }

  function handleStatusChange(next) {
    setStatus(next);
    setPage(1);
    startLoading();
  }

  function handleResetFilters() {
    setStatus("PENDING");
    setSearch("");
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
    getAdminReviews(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          reviews: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        reviews: Array.isArray(data?.reviews) ? data.reviews : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [params, reloadKey]);

  const { status: viewStatus, message, reviews, pagination } = fetchState;
  const hasFilters = status !== "PENDING";

  const query = search.trim().toLowerCase();
  const visibleReviews = query
    ? reviews.filter((review) =>
        [review.customerDisplayName, review.comment, String(review.rating ?? "")]
          .some((value) => value && value.toLowerCase().includes(query))
      )
    : reviews;
  const isSearching = query !== "";

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
                {REVIEW_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {reviewStatusMeta(value).label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Search
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Reviewer, review, or rating"
                className={`${controlClass} w-56`}
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasFilters && !isSearching}
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
            <h2 className="font-display text-lg text-ink">Reviews unavailable</h2>
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

        {viewStatus === "ready" && visibleReviews.length === 0 ? (
          <div className="rounded-2xl border border-gold-soft/70 bg-cream p-10 text-center">
            <p className="text-sm text-muted">
              {isSearching
                ? "No reviews match your search."
                : status === "PENDING"
                  ? "No reviews are waiting for moderation right now."
                  : hasFilters
                    ? "No reviews match the selected filters."
                    : "No reviews have been submitted yet."}
            </p>
          </div>
        ) : null}

        {viewStatus === "ready" && visibleReviews.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            {isSearching ? (
              <p className="text-xs text-muted">
                Showing matches from the loaded page of results.
              </p>
            ) : null}
            <ReviewTable reviews={visibleReviews} onChanged={handleRefresh} className="hidden md:block" />
            <div className="space-y-4 md:hidden">
              {visibleReviews.map((review) => (
                <ReviewCard key={review.id} review={review} onChanged={handleRefresh} />
              ))}
            </div>
            {!isSearching ? (
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            ) : null}
          </motion.div>
        ) : null}
      </div>
  );
}
