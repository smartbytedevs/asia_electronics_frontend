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

function commentPreview(comment) {
  const text = comment || "—";
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

/**
 * Desktop review moderation table. Columns map to the admin review serializer
 * fields: productId, customerDisplayName, rating, comment, status, createdAt,
 * decision timestamps, and approve/reject actions for PENDING rows.
 */
export function ReviewTable({ reviews, onChanged, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Product</th>
              <th scope="col" className="px-4 py-3 font-medium">Reviewer</th>
              <th scope="col" className="px-4 py-3 font-medium">Rating</th>
              <th scope="col" className="px-4 py-3 font-medium">Review</th>
              <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
              <th scope="col" className="px-4 py-3 font-medium">Decision</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-gold-soft/20">
                <td className="px-4 py-3">
                  <StatusBadge meta={reviewStatusMeta(review.status)} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${review.productId}/edit`}
                    className="font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                  >
                    View product
                  </Link>
                </td>
                <td className="px-4 py-3 text-mocha-deep">
                  {review.customerDisplayName || "Customer"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm tracking-tight text-gold">{"★".repeat(review.rating)}</span>
                  <span className="ml-1.5 tabular-nums text-muted">{review.rating}/5</span>
                </td>
                <td className="px-4 py-3 text-muted">{commentPreview(review.comment)}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(review.createdAt)}</td>
                <td className="px-4 py-3 text-muted">{decisionFor(review)}</td>
                <td className="px-4 py-3">
                  <ReviewActions review={review} onChanged={onChanged} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
