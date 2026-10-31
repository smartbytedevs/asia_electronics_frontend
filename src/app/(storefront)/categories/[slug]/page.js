import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { EmptyState } from "../../_components/empty-state";
import { ProductCard } from "../../_components/product-card";
import { ProductRow } from "../../_components/product-row";
import { SortSelect } from "../../_components/sort-select";
import {
  fetchCategoryBySlug,
  fetchProducts,
} from "../../lib/catalog-data";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SORTS = new Set(["newest", "priceAsc", "priceDesc", "featured"]);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const category = await fetchCategoryBySlug(slug);
    if (category) {
      const description =
        typeof category.description === "string"
          ? category.description
          : `Shop ${category.name} at Asia Electronics.`;
      return {
        title: category.name,
        description,
        alternates: {
          canonical: absoluteUrl(`/categories/${category.slug}`),
        },
        openGraph: {
          type: "website",
          url: absoluteUrl(`/categories/${category.slug}`),
          title: `${category.name} | Asia Electronics`,
          description,
          images: [{ url: absoluteUrl("/bg.jpg"), width: 1376, height: 768 }],
        },
        twitter: {
          card: "summary_large_image",
          title: `${category.name} | Asia Electronics`,
          description,
          images: [absoluteUrl("/bg.jpg")],
        },
      };
    }
  } catch {
    // Fall through to the generic title.
  }
  return { title: "Category" };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const { sort } = await searchParams;

  let category;
  try {
    category = await fetchCategoryBySlug(slug);
  } catch (error) {
    if (error?.status === 404) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <EmptyState
          title="Catalog is unavailable"
          description="We couldn't load this category right now. Please try again later."
          actionHref="/collection"
          actionLabel="Back to the catalog"
        />
      </div>
    );
  }

  if (!category) {
    notFound();
  }

  const safeSort = SORTS.has(sort) ? sort : "newest";
  const data = await fetchProducts({
    categoryId: category.id,
    sort: safeSort,
    limit: 48,
  }).catch(() => null);
  const products = data?.products ?? [];

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
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: absoluteUrl(`/categories/${category.slug}`),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-mocha">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{category.name}</li>
        </ol>
      </nav>

      <div className="mt-6 max-w-2xl">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
          Category
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-4 text-base leading-relaxed text-muted">
            {category.description}
          </p>
        ) : null}
      </div>

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
          <ProductRow eyebrow="Category" title={category.name}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductRow>
        ) : (
          <EmptyState
            title={`Nothing in ${category.name} yet`}
            description="New products are being added to this category — check back soon."
            actionHref="/collection"
          />
        )}
      </div>
    </div>
  );
}
