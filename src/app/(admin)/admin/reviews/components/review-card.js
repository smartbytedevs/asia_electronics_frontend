import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { reviewStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { ReviewActions } from "./review-actions";

function decisionFor(review) {
  if (review.status === "APPROVED") {
    return `Approved ${formatDateTime(review.approvedAt)}`;
  }
  if (review.status === "REJECTED") {
    return `Rejected ${formatDateTime(review.rejectedAt)}`;
  }
  return "Awaiting review";
}

/**
 * Mobile review moderation card — the same real fields as the desktop table,
 * laid out for small screens.
 */
export function ReviewCard({ review, onChanged }) {
  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">
            <Link
              href={`/admin/products/${review.productId}/edit`}
              className="text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
            >
              View product
            </Link>
          </p>
          <p className="mt-0.5 font-medium text-ink">
            {review.customerDisplayName || "Customer"}
          </p>
          <p className="mt-1 text-sm tracking-tight text-gold">
            {"★".repeat(review.rating)}
            <span className="ml-1.5 tabular-nums text-muted">{review.rating}/5</span>
          </p>
        </div>
        <StatusBadge meta={reviewStatusMeta(review.status)} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-mocha-deep">
        {review.comment || "No comment provided."}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Submitted</dt>
          <dd className="text-ink">{formatDateTime(review.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Decision</dt>
          <dd className="text-ink">{decisionFor(review)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-gold-soft/40 pt-3">
        <Link
          href={`/admin/reviews/${review.id}`}
          className="text-sm font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
        >
          View details
        </Link>
        <ReviewActions review={review} onChanged={onChanged} />
      </div>
    </article>
  );
}
