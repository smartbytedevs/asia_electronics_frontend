"use client";

import Link from "next/link";
import { Ban, Eye, Pencil, Tags } from "lucide-react";
import { formatDate, formatMinorUnits } from "@/lib/utils";
import {
  productFlagLabel,
  productStatusMeta,
} from "../../components/status-meta";

const editButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gold/50 bg-gold-soft/30 px-3 text-sm font-medium text-mocha-deep transition-colors hover:border-gold hover:bg-gold-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const deactivateButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-[#c9604d] transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2";

/**
 * Mobile product card — the same fields as the desktop table, laid out for
 * small screens. No raw IDs are shown, only names, slugs and category names.
 */
export function ProductCard({ product, onDeactivate }) {
  const status = productStatusMeta(product.isActive);
  const discounted = product.discount
    ? product.sellingPrice !== product.effectiveSellingPrice
    : false;

  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4 shadow-[0_2px_14px_-16px_rgba(43,38,32,0.35)] transition-colors hover:border-gold-soft">
      <div className="flex items-start gap-3">
        {product.images?.[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            className="h-16 w-16 shrink-0 rounded-xl border border-gold-soft/60 object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gold-soft/60 bg-sand/60 text-sm text-muted">
            —
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{product.name}</p>
              <p className="truncate text-xs tabular-nums text-muted">
                /{product.slug}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-current"
              />
              {status.label}
            </span>
          </div>

          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-mocha-deep">
            <Tags aria-hidden="true" className="h-3.5 w-3.5 text-mocha/50" />
            {product.category?.name ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {productFlagLabel("featured") && product.featured ? (
          <span className="rounded-full border border-gold-soft bg-gold-soft/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mocha">
            Featured
          </span>
        ) : null}
        {productFlagLabel("newArrival") && product.newArrival ? (
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700">
            New
          </span>
        ) : null}
        {productFlagLabel("bestDeal") && product.bestDeal ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
            Best deal
          </span>
        ) : null}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Price</dt>
          <dd className="font-semibold tabular-nums text-mocha-deep">
            {formatMinorUnits(product.effectiveSellingPrice)}
            {discounted ? (
              <span className="ml-1.5 text-xs font-normal text-muted line-through">
                {formatMinorUnits(product.sellingPrice)}
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">
            Created
          </dt>
          <dd className="text-ink">{formatDate(product.createdAt)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-gold-soft/40 pt-3">
        <Link
          href={`/products/${product.slug}`}
          title="View on storefront"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          View
        </Link>
        <Link href={`/admin/products/${product.id}/edit`} className={editButtonClass}>
          <Pencil aria-hidden="true" className="h-4 w-4" />
          Edit
        </Link>
        <button
          type="button"
          onClick={() => onDeactivate(product)}
          className={deactivateButtonClass}
        >
          <Ban aria-hidden="true" className="h-4 w-4" />
          Deactivate
        </button>
      </div>
    </article>
  );
}
