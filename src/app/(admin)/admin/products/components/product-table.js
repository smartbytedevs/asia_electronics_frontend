"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Ban, Eye, Pencil, Tags } from "lucide-react";
import { formatDate, formatMinorUnits } from "@/lib/utils";
import {
  productFlagLabel,
  productStatusMeta,
} from "../../components/status-meta";

const EASE = [0.22, 1, 0.36, 1];

const viewButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const editButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gold/50 bg-gold-soft/30 px-3 text-sm font-medium text-mocha-deep transition-colors hover:border-gold hover:bg-gold-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const deactivateButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-[#c9604d] transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2";

/**
 * Desktop products table. Columns map to the backend product-card serializer
 * (product.serializer.js: serializeProductCard) — no raw IDs are shown, only
 * human-readable names, slugs, and category names. The list is ACTIVE-only, so
 * every row renders the Active badge; the featured/new/best-deal flags are the
 * meaningful catalog indicators here.
 */
export function ProductTable({ products, onDeactivate, className }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream shadow-[0_2px_18px_-16px_rgba(43,38,32,0.35)] ${className ?? ""}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-gold-soft/40 bg-sand/60 text-[0.68rem] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                Product
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                Category
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                Price
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                Flags
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                Created
              </th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {products.map((product, index) => {
              const status = productStatusMeta(product.isActive);
              const discounted = product.discount
                ? product.sellingPrice !== product.effectiveSellingPrice
                : false;
              return (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: EASE,
                    delay: Math.min(index * 0.03, 0.3),
                  }}
                  className="transition-colors hover:bg-gold-soft/20"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                          className="h-11 w-11 shrink-0 rounded-lg border border-gold-soft/60 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold-soft/60 bg-sand/60 text-sm text-muted">
                          —
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {product.name}
                        </p>
                        <p className="truncate text-xs tabular-nums text-muted">
                          /{product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-mocha-deep">
                      <Tags
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 text-mocha/50"
                      />
                      {product.category?.name ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold tabular-nums text-mocha-deep">
                      {formatMinorUnits(product.effectiveSellingPrice)}
                    </span>
                    {discounted ? (
                      <span className="ml-1.5 text-xs tabular-nums text-muted line-through">
                        {formatMinorUnits(product.sellingPrice)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {productFlagLabel("featured") && product.featured ? (
                        <span className="rounded-full border border-gold-soft bg-gold-soft/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mocha">
                          Featured
                        </span>
                      ) : null}
                      {productFlagLabel("newArrival") &&
                      product.newArrival ? (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700">
                          New
                        </span>
                      ) : null}
                      {productFlagLabel("bestDeal") && product.bestDeal ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                          Best deal
                        </span>
                      ) : null}
                      {!product.featured &&
                      !product.newArrival &&
                      !product.bestDeal ? (
                        <span className="text-xs text-muted">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-current"
                      />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        title="View on storefront"
                        className={viewButtonClass}
                      >
                        <Eye aria-hidden="true" className="h-4 w-4" />
                        <span className="hidden lg:inline">View</span>
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className={editButtonClass}
                      >
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
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
