export function normalizeReviewSummary(data) {
  const summary = data?.summary ?? data ?? {};
  const averageRating = Number(summary.averageRating);
  const totalReviews = Number(summary.totalReviews ?? data?.pagination?.total ?? 0);

  return {
    averageRating:
      Number.isFinite(averageRating) && averageRating > 0 ? averageRating : null,
    totalReviews:
      Number.isFinite(totalReviews) && totalReviews > 0 ? totalReviews : 0,
    ratingBreakdown: summary.ratingBreakdown ?? {},
  };
}
