import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "../../_components/product-gallery";
import { ProductPurchase } from "../../_components/add-to-cart";
import { ReviewForm } from "../../_components/review-form";
import { EmptyState } from "../../_components/empty-state";
import { Reveal } from "../../_components/reveal";
import { ChevronRightIcon, GemIcon, StarIcon } from "../../_components/icons";
import { formatDate } from "@/lib/utils";
import { absoluteUrl, absoluteImageUrls } from "@/lib/seo";
import {
  fetchProductBySlug,
  fetchProductReviews,
} from "../../lib/catalog-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const product = await fetchProductBySlug(slug);
    if (product) {
      const description =
        typeof product.description === "string"
          ? product.description.slice(0, 155)
          : `Shop ${product.name} at Asia Electronics.`;
      const ogImage = product.images?.[0]?.url || "/bg.jpg";
      return {
        title: product.name,
        description,
        alternates: {
          canonical: absoluteUrl(`/products/${product.slug}`),
        },
        openGraph: {
          type: "website",
          url: absoluteUrl(`/products/${product.slug}`),
          title: `${product.name} | Asia Electronics`,
          description,
          images: [absoluteUrl(ogImage)],
        },
        twitter: {
          card: "summary_large_image",
          title: `${product.name} | Asia Electronics`,
          description,
          images: [absoluteUrl(ogImage)],
        },
      };
    }
  } catch {
    // Fall through to the generic title.
  }
  return { title: "Product" };
}

function ReviewStars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-gold" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <StarIcon
          key={value}
          className="h-3.5 w-3.5"
          filled={value <= Math.round(rating)}
        />
      ))}
    </span>
  );
}

/** Catalog badges the backend actually provides (newArrival / bestDeal). */
function ProductBadges({ product }) {
  const showNew = Boolean(product.newArrival);
  const showBest = Boolean(product.bestDeal);
  if (!showNew && !showBest) {
    return null;
  }
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {showNew ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-soft/70 bg-white/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mocha-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
          New arrival
        </span>
      ) : null}
      {showBest ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cream">
          <GemIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Best deal
        </span>
      ) : null}
    </div>
  );
}

/**
 * Key catalog facts surfaced from the backend detail contract: category,
 * electronics facts (brand, model, warranty, product SKU, specifications) and,
 * when the product has variants, its available options and per-variant SKUs.
 */
function KeyDetails({ product }) {
  const activeVariants = (product.variants || []).filter((v) => v.isActive);
  const rows = [];

  if (product.category?.name) {
    rows.push({
      label: "Category",
      content: product.category.slug ? (
        <Link
          href={`/categories/${product.category.slug}`}
          className="transition-colors hover:text-gold"
        >
          {product.category.name}
        </Link>
      ) : (
        product.category.name
      ),
    });
  }

  if (product.brand) {
    rows.push({ label: "Brand", content: product.brand });
  }
  if (product.modelNumber) {
    rows.push({ label: "Model", content: product.modelNumber });
  }
  if (product.warrantyPeriod) {
    rows.push({
      label: "Warranty",
      content: `${product.warrantyPeriod} month${product.warrantyPeriod === 1 ? "" : "s"}`,
    });
  }

  const sizeLabels = [
    ...new Set(
      activeVariants
        .map((v) => Object.values(v.attributes || {}).filter(Boolean).join(" · "))
        .filter(Boolean)
    ),
  ];
  if (sizeLabels.length) {
    rows.push({ label: "Available options", content: sizeLabels.join(", ") });
  }

  const skus = [
    ...new Set(
      [product.stockKeepingUnit, ...activeVariants.map((v) => v.sku)].filter(
        Boolean
      )
    ),
  ];
  if (skus.length) {
    rows.push({ label: "SKU", content: skus.join(", ") });
  }

  for (const [key, value] of Object.entries(product.specifications || {})) {
    if (value === null || value === undefined || String(value).trim() === "") {
      continue;
    }
    rows.push({ label: key, content: String(value) });
  }

  if (!rows.length) {
    return null;
  }

  return (
    <dl className="mt-8 overflow-hidden rounded-3xl border border-gold-soft/50 bg-white/70 shadow-sm shadow-ink/5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-4 px-6 py-4 odd:bg-transparent even:bg-white/60"
        >
          <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
            {row.label}
          </dt>
          <dd className="text-right text-sm text-mocha-deep">{row.content}</dd>
        </div>
      ))}
    </dl>
  );
}

async function ReviewsSection({ productId, slug }) {
  let data;
  try {
    data = await fetchProductReviews(productId);
  } catch {
    return (
      <section className="mt-16">
        <h2 className="font-display text-2xl text-ink">Reviews</h2>
        <p className="mt-4 text-sm text-muted">
          Reviews are unavailable right now — please try again later.
        </p>
      </section>
    );
  }

  const { reviews, summary } = data;
  const breakdownEntries = [5, 4, 3, 2, 1]
    .map((rating) => ({
      rating,
      count: summary.ratingBreakdown?.[rating] ?? 0,
    }))
    .filter((entry) => entry.count > 0);
  const maxBreakdown = Math.max(1, ...breakdownEntries.map((entry) => entry.count));

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
        <h2 className="font-display text-2xl text-ink sm:text-3xl">Reviews</h2>
      </div>

      {summary.totalReviews > 0 ? (
        <div className="mt-6 grid gap-8 rounded-3xl border border-gold-soft/50 bg-white/70 p-6 shadow-sm shadow-ink/5 sm:grid-cols-[auto_1fr] sm:items-start sm:p-8">
          <div className="text-center sm:min-w-40">
            <p className="font-display text-5xl text-ink">
              {summary.averageRating ?? "—"}
            </p>
            <div className="mt-2 flex justify-center">
              <ReviewStars rating={summary.averageRating ?? 0} />
            </div>
            <p className="mt-2 text-xs text-muted">
              {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
            </p>
          </div>
          <div className="space-y-2.5">
            {breakdownEntries.map((entry) => (
              <div key={entry.rating} className="flex items-center gap-3 text-sm">
                <span className="w-10 shrink-0 text-muted">{entry.rating}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${(entry.count / maxBreakdown) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <ul className="mt-8 space-y-6">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-3xl border border-gold-soft/50 bg-white/70 p-6 shadow-sm shadow-ink/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <ReviewStars rating={review.rating} />
                  <span className="text-sm font-medium text-ink">
                    {review.customerDisplayName || "An Asia Electronics customer"}
                  </span>
                </div>
                <time className="text-xs text-muted">
                  {formatDate(review.createdAt)}
                </time>
              </div>
              {review.comment ? (
                <p className="mt-3 text-sm leading-relaxed text-mocha-deep">
                  {review.comment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">
          No reviews yet — be the first to share your thoughts.
        </p>
      )}

      <ReviewForm productId={productId} slug={slug} />
    </section>
  );
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  let product;
  try {
    product = await fetchProductBySlug(slug);
  } catch (error) {
    if (error?.status === 404) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <EmptyState
          title="Catalog is unavailable"
          description="We couldn't load this product right now. Please try again later."
          actionHref="/collection"
          actionLabel="Back to the catalog"
        />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const activeVariants = (product.variants || []).filter((v) => v.isActive);
  const hasVariants = (product.variants || []).length > 0;
  const inStock =
    product.isActive !== false && (!hasVariants || activeVariants.length > 0);
  const priceMinor =
    product.effectiveSellingPrice ?? product.sellingPrice;
  const sku = activeVariants.map((v) => v.sku).find(Boolean);

  const productUrl = absoluteUrl(`/products/${product.slug}`);

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "All Products", item: absoluteUrl("/collection") },
  ];
  if (product.category?.name) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: product.category.name,
      item: product.category.slug
        ? absoluteUrl(`/categories/${product.category.slug}`)
        : undefined,
    });
  }
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: product.name,
    item: productUrl,
  });

  const reviewData = await fetchProductReviews(product.id).catch(() => null);
  const aggregateRating =
    reviewData?.summary?.totalReviews > 0 &&
    Number.isFinite(reviewData.summary.averageRating)
      ? {
          "@type": "AggregateRating",
          ratingValue: reviewData.summary.averageRating,
          reviewCount: reviewData.summary.totalReviews,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
      {
        "@type": "Product",
        "@id": `${productUrl}#product`,
        name: product.name,
        image: absoluteImageUrls((product.images || []).map((img) => img.url)),
        description:
          typeof product.description === "string"
            ? product.description
            : undefined,
        category: product.category?.name,
        ...(sku ? { sku } : {}),
        ...(aggregateRating ? { aggregateRating } : {}),
        offers: {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "BDT",
          price: Number.isFinite(priceMinor) ? priceMinor / 100 : undefined,
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Reveal y={12}>
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-mocha">
                Home
              </Link>
            </li>
            {product.category?.slug ? (
              <>
                <li aria-hidden="true">
                  <ChevronRightIcon className="h-3 w-3 text-muted/60" />
                </li>
                <li>
                  <Link
                    href={`/categories/${product.category.slug}`}
                    className="transition-colors hover:text-mocha"
                  >
                    {product.category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">
              <ChevronRightIcon className="h-3 w-3 text-muted/60" />
            </li>
            <li className="max-w-44 truncate font-medium text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
      </Reveal>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="lg:sticky lg:top-24 lg:self-start" y={24}>
          <ProductGallery images={product.images} name={product.name} />
        </Reveal>

        <div className="flex flex-col">
          <Reveal y={24}>
            {product.category?.name ? (
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-gold">
                {product.category.name}
              </p>
            ) : null}
            <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              {product.name}
            </h1>
            <ProductBadges product={product} />
          </Reveal>

          <Reveal y={24} delay={0.08}>
            <div className="mt-7">
              <ProductPurchase product={product} />
            </div>
          </Reveal>

          <Reveal y={24} delay={0.14}>
            <KeyDetails product={product} />
          </Reveal>

          {product.description ? (
            <Reveal y={24} delay={0.2}>
              <div className="mt-8 border-t border-sand pt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
                  Description
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mocha-deep">
                  {product.description}
                </p>
              </div>
            </Reveal>
          ) : null}
        </div>
      </div>

      <Reveal y={24}>
        <ReviewsSection productId={product.id} slug={product.slug} />
      </Reveal>
    </div>
  );
}
