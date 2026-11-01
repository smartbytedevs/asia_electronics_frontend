import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { apiClient } from "@/lib/api-client";

// Re-generated from the live catalog once a day (ISR), never at build time,
// so a temporarily unreachable backend cannot break `next build`.
export const revalidate = 86400;

const PRODUCT_PAGE_SIZE = 100;
// Safety cap so a malformed pagination response can never loop forever.
const MAX_PRODUCT_PAGES = 50;

type SitemapEntry = MetadataRoute.Sitemap[number];

function lastModified(value?: string | Date | null): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Fetches every active product page, not just the first one, so a growing
 * catalog is fully represented in the sitemap.
 */
async function fetchAllProductSlugs() {
  const products: Array<{
    slug?: string;
    updatedAt?: string;
    createdAt?: string;
  }> = [];

  for (let page = 1; page <= MAX_PRODUCT_PAGES; page += 1) {
    const payload = await apiClient.get(
      `/products?limit=${PRODUCT_PAGE_SIZE}&page=${page}`
    );
    const batch = payload?.data?.products ?? [];
    products.push(...batch);

    if (batch.length === 0) {
      break;
    }

    const totalPages = Number(payload?.data?.pagination?.totalPages);
    if (Number.isFinite(totalPages) && totalPages > 0) {
      if (page >= totalPages) {
        break;
      }
    } else if (batch.length < PRODUCT_PAGE_SIZE) {
      break;
    }
  }

  return products;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: SitemapEntry[] = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/collection`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/track-order`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const categoriesPayload = await apiClient.get("/categories");
    const categories = categoriesPayload?.data?.categories ?? [];
    for (const category of categories) {
      if (!category?.slug || category.isActive === false) {
        continue;
      }
      entries.push({
        url: `${SITE_URL}/categories/${category.slug}`,
        lastModified: lastModified(category.updatedAt ?? category.createdAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // A failed catalog fetch must not wipe the sitemap — keep static URLs.
  }

  try {
    // Listing endpoint is used directly (not fetchProducts) to avoid its
    // per-product detail enrichment round-trips during sitemap generation.
    const products = await fetchAllProductSlugs();
    for (const product of products) {
      if (!product?.slug) {
        continue;
      }
      entries.push({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: lastModified(product.updatedAt ?? product.createdAt),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // Keep static + category URLs.
  }

  // Deduplicate defensively: one <loc> per URL is required by the sitemap
  // protocol, and a repeated slug must never appear twice.
  const unique = new Map<string, SitemapEntry>();
  for (const entry of entries) {
    if (entry.url && !unique.has(entry.url)) {
      unique.set(entry.url, entry);
    }
  }

  return Array.from(unique.values());
}
