import { backendRequest, withQuery } from "./http";

/**
 * Reviews module — public storefront reads plus ADMIN moderation.
 * @see backend src/modules/reviews/review.routes.js
 */

/**
 * GET /products/:productId/reviews — public APPROVED reviews for a product.
 * Returns payload.data.reviews, data.pagination, data.averageRating,
 * data.totalReviews and data.ratingBreakdown.
 */
export async function getProductReviews(productId) {
  return backendRequest(`/products/${encodeURIComponent(productId)}/reviews`);
}

/**
 * POST /products/:productId/reviews — submit a customer review. CUSTOMER only.
 * The backend accepts only `{ rating (1-5 integer), comment (optional ≤ 2000) }`;
 * `customerId` / `status` / `approvedBy` are always server-derived and rejected
 * in the body. New reviews are created PENDING and only appear publicly once
 * an admin approves them. Returns `data.review` (customer view) on 201.
 * (Write endpoint; excluded from the read-only API testing phase.)
 * @param {string} productId
 * @param {object} input { rating, comment? }
 */
export async function submitProductReview(productId, { rating, comment } = {}) {
  return backendRequest(`/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: { rating, ...(comment ? { comment } : {}) },
  });
}

/**
 * GET /admin/reviews — paginated review list. ADMIN only.
 * Backend-supported query params: status, productId, page, limit.
 * @param {object} [params]
 */
export async function getAdminReviews(params) {
  return backendRequest(withQuery("/admin/reviews", params));
}

/**
 * GET /admin/reviews/:id — single review (admin view). ADMIN only.
 */
export async function getAdminReview(id) {
  return backendRequest(`/admin/reviews/${encodeURIComponent(id)}`);
}

/**
 * POST /admin/reviews/:id/approve — approve a PENDING review. ADMIN only.
 * Terminal. Accepts an optional `note` (≤ 500 chars). Idempotent when the
 * review is already APPROVED; a REJECTED review returns 409.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function approveReview(id, note) {
  return backendRequest(`/admin/reviews/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: note ? { note } : {},
  });
}

/**
 * POST /admin/reviews/:id/reject — reject a PENDING review. ADMIN only.
 * Terminal. Accepts an optional `note` (≤ 500 chars). Idempotent when the
 * review is already REJECTED; an APPROVED review returns 409.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function rejectReview(id, note) {
  return backendRequest(`/admin/reviews/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: note ? { note } : {},
  });
}
