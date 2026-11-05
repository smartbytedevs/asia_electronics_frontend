import { apiClient } from "@/lib/api-client";

/**
 * Server-side catalog reads for the storefront (SSR). Uses the existing
 * `apiClient` against the backend base URL — the public catalog endpoints
 * need no token. Throws ApiClientError on failure so pages can distinguish a
 * 404 from a backend outage.
 */

function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchCategories() {
  const payload = await apiClient.get("/categories");
  return payload?.data?.categories ?? [];
}

export async function fetchProductById(id) {
  const payload = await apiClient.get(`/products/${encodeURIComponent(id)}`);
  return payload?.data?.product ?? null;
}

export async function fetchProducts({
  categoryId,
  featured,
  newArrival,
  bestDeal,
  sort,
  page,
  limit,
  includeRatings = false,
} = {}) {
  const payload = await apiClient.get(
    `/products${query({
      categoryId,
      featured: featured ? "true" : undefined,
      newArrival: newArrival ? "true" : undefined,
      bestDeal: bestDeal ? "true" : undefined,
      sort,
      page,
      limit,
    })}`
  );
  const products = payload?.data?.products ?? [];

  // The listing endpoint (`GET /products`) returns card summaries without
  // `variants`, but the size popover on ProductCard needs each active
  // variant's `attributes.size`. Enrich each card with its variants from the
  // existing detail endpoint so ProductCard receives the same variant data the
  // product-details page already uses. A failed detail fetch keeps the card
  // untouched (direct Add to Bag) rather than breaking the listing.
  //
  // The list also omits review aggregates, so callers that want ratings on
  // their cards opt into `includeRatings` and receive the same average/count
  // pair the product reviews endpoint exposes.
  const enriched = await Promise.all(
    products.map(async (product) => {
      const [detail, rating] = await Promise.all([
        fetchProductById(product.id).catch(() => null),
        includeRatings
          ? fetchProductRatingSummary(product.id).catch(() => null)
          : null,
      ]);

      let next = product;
      if (Array.isArray(detail?.variants)) {
        next = { ...next, variants: detail.variants };
      }
      if (rating && rating.totalReviews > 0) {
        next = {
          ...next,
          averageRating: rating.averageRating,
          reviewCount: rating.totalReviews,
        };
      }
      return next;
    })
  );

  return {
    products: enriched,
    pagination: payload?.data?.pagination ?? null,
  };
}

export async function fetchCategoryBySlug(slug) {
  const payload = await apiClient.get(`/categories/slug/${encodeURIComponent(slug)}`);
  return payload?.data?.category ?? null;
}

export async function fetchProductBySlug(slug) {
  const payload = await apiClient.get(`/products/slug/${encodeURIComponent(slug)}`);
  return payload?.data?.product ?? null;
}

function normalizeReviewSummary(data) {
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

export async function fetchProductRatingSummary(productId) {
  const payload = await apiClient.get(`/products/${encodeURIComponent(productId)}/reviews`);
  return normalizeReviewSummary(payload?.data ?? {});
}

export async function fetchProductReviews(productId) {
  const payload = await apiClient.get(`/products/${encodeURIComponent(productId)}/reviews`);
  const data = payload?.data ?? {};
  return {
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    summary: normalizeReviewSummary(data),
  };
}

/**
 * Gather a representative selection of the most recent approved reviews for
 * the homepage testimonials. Fetches the newest products and merges their
 * approved reviews (the backend reviews endpoint only returns approved ones),
 * tagging each with the product it belongs to for the card's product link.
 * Fails soft: any product whose review fetch errors is skipped rather than
 * taking down the section.
 */
export async function fetchRecentReviews({ limit = 6 } = {}) {
  const payload = await apiClient.get(
    `/products${query({ sort: "newest", limit: 8 })}`
  );
  const products = payload?.data?.products ?? [];
  if (products.length === 0) return [];

  const perProduct = await Promise.all(
    products.map(async (product) => {
      try {
        const rv = await apiClient.get(
          `/products/${encodeURIComponent(product.id)}/reviews`
        );
        const list = Array.isArray(rv?.data?.reviews) ? rv.data.reviews : [];
        return list.map((review) => ({
          ...review,
          productName: product.name,
          productSlug: product.slug,
        }));
      } catch {
        return [];
      }
    })
  );

  return perProduct
    .flat()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}
