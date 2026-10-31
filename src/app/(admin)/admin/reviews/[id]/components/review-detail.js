"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAdminReview } from "@/lib/api/reviews";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime } from "@/lib/utils";
import { reviewStatusMeta } from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { ReviewActions } from "../../components/review-actions";

const EASE = [0.22, 1, 0.36, 1];

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function SectionCard({ title, children, className }) {
  return (
    <section
      className={`rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6 ${className ?? ""}`}
    >
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Stars({ rating }) {
  const value = Number(rating) || 0;
  return (
    <span
      className="text-lg tracking-tight text-gold"
      aria-label={`${value} out of 5 stars`}
    >
      {"★".repeat(Math.max(0, Math.min(5, value)))}
      {"☆".repeat(Math.max(0, 5 - Math.min(5, value)))}
    </span>
  );
}

/**
 * Single review fetched from `GET /admin/reviews/:id`. Renders exactly the
 * admin serializer's fields — product, reviewer, rating, comment, status,
 * timestamps, moderation history and decision — with the same
 * state-machine-driven actions as the list. Only PENDING reviews get
 * approve/reject buttons.
 */
export function ReviewDetail({ reviewId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    review: null,
  });

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      review: prev.review,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminReview(reviewId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          review: null,
        });
        return;
      }
      setFetchState({
        status: "ready",
        message: null,
        review: result.payload?.data?.review ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [reviewId, reloadKey]);

  const { status, message, review } = fetchState;

  if (status === "loading") {
    return (
      <div aria-hidden="true" className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-sand" />
        <div className="h-48 animate-pulse rounded-2xl bg-sand" />
        <div className="h-56 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
      >
        <h2 className="font-display text-lg text-ink">Review unavailable</h2>
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

  if (!review) {
    return null;
  }

  const history = Array.isArray(review.statusHistory) ? review.statusHistory : [];

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/admin/reviews"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to reviews
        </Link>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Product</p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                <Link
                  href={`/admin/products/${review.productId}/edit`}
                  className="underline-offset-2 hover:underline"
                >
                  View product
                </Link>
              </h2>
              <p className="mt-1 text-sm text-muted">
                Submitted {formatDateTime(review.createdAt)} ·{" "}
                {review.customerDisplayName || "Customer"}
              </p>
            </div>
            <StatusBadge meta={reviewStatusMeta(review.status)} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gold-soft/40 pt-4">
            <p className="text-xs text-muted">
              {review.updatedAt ? (
                <>Updated {formatDateTime(review.updatedAt)}</>
              ) : null}
            </p>
            <ReviewActions review={review} onChanged={handleRefresh} />
          </div>
        </section>

        <SectionCard title="Review">
          <div className="flex items-center gap-3">
            <Stars rating={review.rating} />
            <span className="text-sm font-medium tabular-nums text-mocha-deep">
              {review.rating} / 5
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink">
            {review.comment || "No comment provided."}
          </p>
        </SectionCard>

        <div className="grid gap-6 sm:grid-cols-2">
          <SectionCard title="Product & reviewer">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Product">
                <Link
                  href={`/admin/products/${review.productId}/edit`}
                  className="underline-offset-2 hover:underline"
                >
                  View product
                </Link>
              </DetailRow>
              <DetailRow label="Reviewer">
                {review.customerDisplayName || "Customer"}
              </DetailRow>
            </dl>
          </SectionCard>

          <SectionCard title="Moderation">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Status">
                <StatusBadge meta={reviewStatusMeta(review.status)} />
              </DetailRow>
              {review.status === "APPROVED" ? (
                <>
                  <DetailRow label="Approved by">Staff</DetailRow>
                  <DetailRow label="Approved at">
                    {formatDateTime(review.approvedAt)}
                  </DetailRow>
                </>
              ) : null}
              {review.status === "REJECTED" ? (
                <>
                  <DetailRow label="Rejected by">Staff</DetailRow>
                  <DetailRow label="Rejected at">
                    {formatDateTime(review.rejectedAt)}
                  </DetailRow>
                </>
              ) : null}
              {review.status === "PENDING" ? (
                <DetailRow label="Note">
                  Pending reviews are not visible to the public.
                </DetailRow>
              ) : null}
            </dl>
          </SectionCard>
        </div>

        <SectionCard title="Status history">
          {history.length === 0 ? (
            <p className="text-sm text-muted">No status changes recorded.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge meta={reviewStatusMeta(entry.status)} />
                      <span className="text-xs text-muted">
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-1 text-sm text-mocha-deep">{entry.note}</p>
                    ) : null}
                    {entry.by ? (
                      <p className="mt-0.5 text-xs text-muted">By Staff</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </motion.div>
  );
}
