import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { apiClient } from "@/lib/api-client";

// Re-generated from the live catalog once a day (ISR), never at build time,
// so a temporarily unreachable backend cannot break `next build`.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/collection`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/track-order`, changeFrequency: "monthly", priority: 0.3 },
  ];

  let categoryUrls: MetadataRoute.Sitemap = [];
  let productUrls: MetadataRoute.Sitemap = [];

  try {
    const categoriesPayload = await apiClient.get("/categories");
    const categories = categoriesPayload?.data?.categories ?? [];
    categoryUrls = categories
      .filter((category) => category?.slug)
      .map((category) => ({
        url: `${SITE_URL}/categories/${category.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch {
    // A failed catalog fetch must not wipe the sitemap — keep static URLs.
  }

  try {
    // Listing endpoint is used directly (not fetchProducts) to avoid its
    // per-product detail enrichment round-trips during sitemap generation.
    const productsPayload = await apiClient.get("/products?limit=500");
    const products = productsPayload?.data?.products ?? [];
    productUrls = products
      .filter((product) => product?.slug)
      .map((product) => ({
        url: `${SITE_URL}/products/${product.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
  } catch {
    // Keep static + category URLs.
  }

  return [...staticUrls, ...categoryUrls, ...productUrls];
}
