import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "../_components/empty-state";
import { ProductCard } from "../_components/product-card";
import { ProductRow } from "../_components/product-row";
import { SortSelect } from "../_components/sort-select";
import {
  fetchCategories,
  fetchProducts,
  hasMoreProducts,
} from "../lib/catalog-data";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SORTS = new Set(["newest", "priceAsc", "priceDesc", "featured"]);

const COLLECTION_DESCRIPTION =
  "Browse all Asia Electronics products — speakers, sound boxes, rechargeable torch lights, electric fans, trimmers and grooming devices, with official warranty and delivery across Chittagong and Bangladesh.";

export const metadata = {
  title: "All Products",
  description: COLLECTION_DESCRIPTION,
  keywords: [
    "Asia Electronics products",
    "electronics shop in Chittagong",
    "speakers in Bangladesh",
    "rechargeable torch lights",
    "electric fans",
    "trimmers",
  ],
  alternates: {
    canonical: absoluteUrl("/collection"),
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/collection"),
    title: "All Products | Asia Electronics",
    description: COLLECTION_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/bg.jpg"),
        width: 1376,
        height: 768,
        alt: "Asia Electronics product catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Products | Asia Electronics",
    description: COLLECTION_DESCRIPTION,
    images: [absoluteUrl("/bg.jpg")],
  },
};

/**
 * Groups the flat product list by category. Each category becomes one
 * responsive product grid — products from different categories are never
 * mixed inside the same grid. Uncategorized products get their own trailing
 * group.
 */
function groupByCategory(products) {
  const groups = new Map();
  for (const product of products) {
    const category = product.category;
    const key = category?.id || "uncategorized";
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        name: category?.name || "More products",
        slug: category?.slug || null,
        products: [],
      };
      groups.set(key, group);
    }
    group.products.push(product);
  }
  return Array.from(groups.values());
}

export default async function CollectionPage({ searchParams }) {
  const { sort } = await searchParams;
  const safeSort = SORTS.has(sort) ? sort : "newest";

  const [data, categories] = await Promise.all([
    fetchProducts({
      sort: safeSort,
      limit: 48,
      includeRatings: true,
    }).catch(() => null),
    fetchCategories().catch(() => []),
  ]);
  const products = data?.products ?? [];
  const catalogHasMore = hasMoreProducts(data?.pagination, products.length);
  const sections = await Promise.all(
    groupByCategory(products).map(async (section) => {
      if (!section.slug || !catalogHasMore) {
        return { ...section, hasMore: false };
      }
      const categoryData = await fetchProducts({
        categoryId: section.key,
        limit: 1,
      }).catch(() => null);
      const categoryTotal = Number(categoryData?.pagination?.total);
      return {
        ...section,
        hasMore: Number.isFinite(categoryTotal)
          ? categoryTotal > section.products.length
          : true,
      };
    })
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "All Products",
        item: absoluteUrl("/collection"),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-2xl">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-electric">
          Collection
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          All products
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          The complete Asia Electronics catalog — speakers, lights, fans,
          grooming and home essentials in one place.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="rounded-full border border-sand bg-white px-4 py-2 text-sm text-ink transition-colors hover:border-mocha/30 hover:bg-sand"
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-10 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {products.length} product{products.length === 1 ? "" : "s"}
        </p>
        <Suspense fallback={null}>
          <SortSelect value={safeSort} />
        </Suspense>
      </div>

      <div className="mt-8">
        {products.length > 0 ? (
          <div className="space-y-16">
            {sections.map((section) => (
              <section key={section.key}>
                <ProductRow
                  eyebrow="Category"
                  title={section.name}
                  bottomActionHref={
                    section.hasMore && section.slug
                      ? `/categories/${section.slug}`
                      : undefined
                  }
                  bottomActionLabel="See All"
                >
                  {section.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </ProductRow>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="The catalog is being stocked"
            description="New products are on the way — check back soon."
            actionHref="/"
            actionLabel="Back to home"
          />
        )}
      </div>
    </div>
  );
}
