"use client";

import Link from "next/link";
import { useState } from "react";
import { approveReview, rejectReview } from "@/lib/api/reviews";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";

const ACTION_META = {
  approve: {
    title: "Approve review",
    description:
      "Approve this review. It will become publicly visible on the product page and cannot be changed afterwards.",
    confirmLabel: "Approve review",
    className: "bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold",
  },
  reject: {
    title: "Reject review",
    description:
      "Reject this review. It will not be shown publicly and the decision is final.",
    confirmLabel: "Reject review",
    className:
      "bg-[#c9604d] text-white hover:bg-[#b35442] focus-visible:ring-[#c9604d]",
  },
};

const SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

function stars(rating) {
  const value = Number(rating) || 0;
  return (
    <span
      className="text-sm tracking-tight text-gold"
      aria-label={`${value} out of 5 stars`}
    >
      {"★".repeat(Math.max(0, Math.min(5, value)))}
      {"☆".repeat(Math.max(0, 5 - Math.min(5, value)))}
    </span>
  );
}

function ReviewSummary({ review }) {
  return (
    <div className="rounded-xl border border-gold-soft/70 bg-sand/50 p-4">
      <dl className="space-y-2 text-sm">
        <div className="flex items-start justify-between gap-6">
          <dt className="text-muted">Product</dt>
          <dd className="text-right font-medium text-ink">
            <Link
              href={`/admin/products/${review.productId}/edit`}
              className="underline-offset-2 hover:underline"
            >
              View product
            </Link>
          </dd>
        </div>
        <div className="flex items-start justify-between gap-6">
          <dt className="text-muted">Reviewer</dt>
          <dd className="text-right font-medium text-ink">
            {review.customerDisplayName || "Customer"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-6">
          <dt className="text-muted">Rating</dt>
          <dd className="text-right font-medium text-ink">
            {stars(review.rating)} {review.rating}/5
          </dd>
        </div>
        <div className="flex items-start justify-between gap-6">
          <dt className="text-muted">Review</dt>
          <dd className="max-w-[280px] text-right text-ink">
            {review.comment || "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Review moderation actions. Only PENDING reviews get actions — APPROVED and
 * REJECTED are terminal (no reversal), so no buttons render for them. A
 * confirmation dialog guards every decision and shows the review so the
 * decision is informed. On success the caller refreshes. If the backend
 * returns 409 (another admin already moderated this review), the safe
 * message is shown and the caller refreshes so the stale decision never
 * lingers.
 */
export function ReviewActions({ review, onChanged }) {
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (review.status !== "PENDING") {
    return <span className="text-xs text-muted/60">—</span>;
  }

  const calls = {
    approve: approveReview,
    reject: rejectReview,
  };

  async function run(action, note) {
    setLoading(true);
    setError(null);
    const result = await calls[action](review.id, note);
    setLoading(false);
    if (result.ok) {
      setDialog(null);
      onChanged();
    } else {
      setError(safeMessage(result.status, result.payload));
      if (result.status === 409) {
        onChanged();
      }
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDialog("approve");
          }}
          className={`${SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDialog("reject");
          }}
          className={`${SMALL_BUTTON} border-[#c9604d]/40 text-[#c9604d] hover:bg-red-50`}
        >
          Reject
        </button>
      </div>

      {dialog ? (
        <ConfirmDialog
          title={ACTION_META[dialog].title}
          description={ACTION_META[dialog].description}
          noteLabel="Moderation note (optional)"
          confirmLabel={ACTION_META[dialog].confirmLabel}
          confirmClassName={ACTION_META[dialog].className}
          loading={loading}
          error={error}
          onConfirm={(note) => run(dialog, note)}
          onClose={() => {
            if (!loading) {
              setDialog(null);
              setError(null);
            }
          }}
        >
          <ReviewSummary review={review} />
        </ConfirmDialog>
      ) : null}
    </>
  );
}
