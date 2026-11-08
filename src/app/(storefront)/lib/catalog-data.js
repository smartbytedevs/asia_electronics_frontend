import { cache } from "react";
import { apiClient } from "@/lib/api-client";
import { normalizeReviewSummary } from "./review-summary";

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

// Memoized per server render so the layout header/footer and the homepage
// category grid share a single `/categories` request instead of three.
export const fetchCategories = cache(async () => {
  const payload = await apiClient.get("/categories");
  return payload?.data?.categories ?? [];
});

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

  // The listing endpoint now embeds each card's active variants, so no
  // per-product detail fan-out is needed. Ratings are optional and fetched in
  // ONE batched request for the whole page (or skipped entirely).
  let ratings = {};
  if (includeRatings && products.length > 0) {
    ratings = await fetchProductRatingSummaries(
      products.map((product) => product.id)
    ).catch(() => ({}));
  }

  const enriched = products.map((product) => {
    const rating = ratings[product.id];
    if (rating && rating.totalReviews > 0) {
      return {
        ...product,
        averageRating: rating.averageRating,
        reviewCount: rating.totalReviews,
      };
    }
    return product;
  });

  return {
    products: enriched,
    pagination: payload?.data?.pagination ?? null,
  };
}

/**
 * Batched rating summaries for catalog cards — one backend query for the whole
 * page instead of one `/products/:id/reviews` request per card.
 */
export async function fetchProductRatingSummaries(productIds) {
  const ids = (productIds ?? []).filter(Boolean);
  if (ids.length === 0) {
    return {};
  }
  const payload = await apiClient.get(
    `/products/ratings/summary?ids=${encodeURIComponent(ids.join(","))}`
  );
  return payload?.data?.ratings ?? {};
}

/**
 * Homepage "New arrivals" query, memoized per request so the reviews section
 * can reuse the same product list instead of issuing another `/products` call.
 */
export const fetchHomeNewArrivals = cache(async () => {
  return fetchProducts({
    newArrival: true,
    sort: "newest",
    limit: 8,
    includeRatings: true,
  });
});

export async function fetchCategoryBySlug(slug) {
  const payload = await apiClient.get(`/categories/slug/${encodeURIComponent(slug)}`);
  return payload?.data?.category ?? null;
}

export async function fetchProductBySlug(slug) {
  const payload = await apiClient.get(`/products/slug/${encodeURIComponent(slug)}`);
  return payload?.data?.product ?? null;
}

export function hasMoreProducts(pagination, shownCount) {
  const total = Number(pagination?.total);
  if (Number.isFinite(total) && total >= 0) {
    return total > shownCount;
  }
  const totalPages = Number(pagination?.totalPages);
  if (Number.isFinite(totalPages) && totalPages > 0) {
    return totalPages > 1;
  }
  return false;
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
export async function fetchRecentReviews({ limit = 6, products: provided } = {}) {
  const products = provided ?? (await fetchHomeNewArrivals()).products ?? [];
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
