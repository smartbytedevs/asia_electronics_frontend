"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AddToCartButton,
  OrderNowButton,
  buildSizeOptions,
  useOrderNow,
  useProductAvailability,
} from "./add-to-cart";
import { buildCartEntry, useCart } from "./cart-context";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import { BagIcon, ChevronDownIcon, HeartIcon } from "./icons";
import { useWishlist } from "./wishlist-context";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Storefront product grid card (client). A compact vertical card — contained
 * product image on top, followed by brand, name, price/discount, wishlist and
 * the purchase actions. Cards sit in the responsive grid from `ProductRow`:
 * two per row on mobile, two/three on tablet and four on desktop. Cards keep
 * a full-height flex column so rows stay aligned. Images use `object-contain`
 * so the full product is always visible, never cropped. Only buttons, badges
 * and the size popover stay rounded.
 *
 * All stock and purchase logic is unchanged and shared with the product detail
 * page via `useProductAvailability`:
 *   - fully unavailable pieces show an "Out of stock" pill instead of buttons;
 *   - multi-size pieces open a shared size popover (Add to bag or Order now)
 *     in which out-of-stock sizes are disabled;
 *   - single-size / size-less pieces act on the first active variant that is
 *     in stock, so a partially-stocked product never adds an empty variant.
 *
 * The wishlist is client-side only (localStorage) — no backend involvement.
 * Hover/tap animation is Motion-driven and always plays — reduced-motion
 * preferences are intentionally ignored; pricing, badges and data are
 * untouched.
 */
export function ProductCard({ product, className = "" }) {
  const { addItem } = useCart();
  const orderNow = useOrderNow();
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product.id);

  // 1. Check if variants array exists and has items
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  // 2. Product is available if:
  //    - The product itself is active (`product.isActive !== false`)
  //    - AND (it has no variants array attached OR at least one variant is active)
  const isAvailable =
    product.isActive !== false &&
    (!hasVariants || product.variants.some((v) => v.isActive));

  // 3. When a product offers a real choice of sizes (>1 size token across its
  //    active variants), "Add to bag" / "Order now" opens a size-selection
  //    popover instead of acting on a sizeless line the backend would reject.
  //    Single-size and size-less products act directly.
  const activeVariants = (product.variants || []).filter((v) => v.isActive);
  const hasActiveVariants = activeVariants.length > 0;
  const sizeOptions = buildSizeOptions(activeVariants);
  const hasSizeChoice = sizeOptions.length > 1;

  // Live availability — identical to the product detail page.
  const { availability } = useProductAvailability(product.id);
  const availabilityReady = availability.status === "ready";
  const availabilityLoading = availability.status === "loading";
  const availabilityMap = availabilityReady ? availability.map : null;
  const productAvailability = availabilityReady ? availability.product : null;

  // Missing availability record = out of stock (the rule the backend applies).
  const isVariantOutOfStock = (variantId) => {
    if (!availabilityReady) {
      return false;
    }
    const entry = availabilityMap?.[variantId];
    return entry ? Boolean(entry.isOutOfStock) : true;
  };

  const isSimpleOutOfStock = availabilityReady
    ? Boolean(productAvailability ? productAvailability.isOutOfStock : true)
    : false;

  const isFullyOutOfStock = hasActiveVariants
    ? availabilityReady &&
      activeVariants.length > 0 &&
      activeVariants.every((variant) => isVariantOutOfStock(variant.id))
    : isSimpleOutOfStock;

  // Mirrors the product detail panel: variant products stay clickable while
  // availability loads; simple products wait until availability is known.
  const controlsDisabled = hasActiveVariants
    ? !availabilityLoading && Boolean(isFullyOutOfStock)
    : !availabilityReady || Boolean(isSimpleOutOfStock);

  // For the direct add / order path (no real size choice), resolve the first
  // active variant that is actually in stock so a partially-stocked product
  // never adds an out-of-stock variant.
  const directVariant = (() => {
    if (availabilityReady) {
      const available = activeVariants.find(
        (variant) => !isVariantOutOfStock(variant.id)
      );
      if (available) {
        return available;
      }
    }
    return activeVariants[0] ?? null;
  })();

  const [pendingAction, setPendingAction] = useState(null); // "add" | "order" | null
  const sizePopoverOpen = pendingAction !== null;
  const popoverRef = useRef(null);
  const toggleRef = useRef(null);

  // Close the popover on Escape or on a tap/click anywhere outside it.
  useEffect(() => {
    if (!sizePopoverOpen) {
      return;
    }
    const onPointerDown = (event) => {
      const target = event.target;
      if (popoverRef.current?.contains(target)) {
        return;
      }
      if (toggleRef.current?.contains(target)) {
        return;
      }
      setPendingAction(null);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setPendingAction(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sizePopoverOpen]);

  const togglePicker = (action) => {
    setPendingAction((prev) => (prev === action ? null : action));
  };

  const runSizeAction = (option) => {
    if (pendingAction === "order") {
      orderNow(product, option.variantId, option.size, 1);
    } else {
      addItem(buildCartEntry(product, option.variantId, 1, option.size));
    }
    setPendingAction(null);
  };

  const showDiscountBadge =
    product.effectiveSellingPrice != null &&
    product.sellingPrice != null &&
    product.effectiveSellingPrice < product.sellingPrice;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.3, ease: EASE }}
      data-product-card
      className={
        "group relative flex h-full flex-col rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(8,20,46,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-electric/30 hover:shadow-[0_22px_48px_-34px_rgba(8,20,46,0.45)] " +
        className
      }
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-sand via-white to-sand"
        aria-label={product.name}
      >
        <ProductImage
          src={product.images?.[0]?.url}
          alt={product.images?.[0]?.alt || product.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          imgClassName="h-full w-full object-contain object-center p-3 transition-transform duration-500 ease-out group-hover:scale-[1.05] sm:p-5"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(31,107,255,0.1),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1 sm:left-2.5 sm:top-2.5 sm:gap-1.5">
          {product.newArrival ? (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-white sm:px-2.5 sm:py-1 sm:text-[0.58rem] sm:tracking-[0.16em]">
              New
            </span>
          ) : null}
          {showDiscountBadge ? (
            <span className="rounded-full bg-electric px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-white sm:px-2.5 sm:py-1 sm:text-[0.58rem] sm:tracking-[0.16em]">
              Sale
            </span>
          ) : null}
        </div>
      </Link>

      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        transition={{ duration: 0.15, ease: EASE }}
        aria-pressed={saved}
        aria-label={
          saved
            ? `Remove ${product.name} from wishlist`
            : `Add ${product.name} to wishlist`
        }
        onClick={() => toggle(product.id)}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-ink/[0.06] bg-white/90 text-ink shadow-sm shadow-ink/5 backdrop-blur-sm transition-colors hover:bg-white hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 sm:right-2.5 sm:top-2.5 sm:h-9 sm:w-9"
      >
        <HeartIcon
          className={"h-4 w-4 transition-colors " + (saved ? "fill-current text-electric" : "")}
        />
      </motion.button>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3.5">
        {product.brand || product.category?.name ? (
          <p className="line-clamp-1 text-[0.54rem] font-semibold uppercase tracking-[0.2em] text-electric sm:text-[0.6rem] sm:tracking-[0.22em]">
            {product.brand || product.category.name}
          </p>
        ) : null}
        <Link
          href={`/products/${product.slug}`}
          title={product.name}
          className="mt-1 line-clamp-2 min-h-[2.4em] text-[0.8rem] font-semibold leading-snug text-ink transition-colors hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 sm:mt-1.5 sm:text-[0.95rem]"
        >
          {product.name}
        </Link>
        <div className="mt-1.5 sm:mt-2">
          <Price product={product} className="text-sm sm:text-[0.95rem]" />
        </div>

        <div className="mt-auto pt-2.5 sm:pt-3.5">
          {!isAvailable ? (
            <p className="flex w-full items-center justify-center rounded-full border border-ink/10 bg-sand px-3 py-2 text-xs font-medium text-muted">
              Unavailable
            </p>
          ) : isFullyOutOfStock ? (
            <p className="flex w-full items-center justify-center rounded-full border border-ink/10 bg-sand px-3 py-2 text-xs font-medium text-muted">
              Out of stock
            </p>
          ) : hasSizeChoice ? (
            <div className="relative">
              <div ref={toggleRef} className="flex flex-col gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={sizePopoverOpen}
                  onClick={() => togglePicker("add")}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <BagIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="inline-flex items-center gap-1">
                    Add to cart
                    <ChevronDownIcon
                      className={
                        "h-3 w-3 opacity-70 transition-transform duration-200 sm:h-3.5 sm:w-3.5 " +
                        (sizePopoverOpen ? "rotate-180" : "")
                      }
                    />
                  </span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  type="button"
                  onClick={() => togglePicker("order")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-electric/40 hover:bg-electric-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Buy now
                </motion.button>
              </div>

              <AnimatePresence>
                {sizePopoverOpen ? (
                  <motion.div
                    ref={popoverRef}
                    role="listbox"
                    aria-label={`Options for ${product.name}`}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="absolute bottom-full left-0 right-0 z-50 mb-2 origin-bottom rounded-xl border border-ink/10 bg-white p-2 shadow-xl shadow-ink/10"
                  >
                    <p className="px-2 pb-1.5 pt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted">
                      Choose an option
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sizeOptions.map((option, index) => {
                        const optionDisabled = isVariantOutOfStock(option.variantId);
                        return (
                          <motion.button
                            key={`${option.variantId}-${option.size}`}
                            type="button"
                            role="option"
                            aria-disabled={optionDisabled}
                            disabled={optionDisabled}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.18,
                              ease: EASE,
                              delay: index * 0.03,
                            }}
                            onClick={() => runSizeAction(option)}
                            className={
                              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 " +
                              (optionDisabled
                                ? "cursor-not-allowed border-ink/10 bg-sand text-muted/70 line-through"
                                : "border-ink/15 bg-white text-ink hover:border-electric/50 hover:bg-electric-soft")
                            }
                          >
                            {option.size}
                          </motion.button>
                        );
                      })}
                    </div>
                    {pendingAction === "order" ? (
                      <p className="mt-1.5 px-2 pb-0.5 text-center text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-electric">
                        Buy now
                      </p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <motion.div
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="w-full"
              >
                <AddToCartButton
                  product={product}
                  variantId={directVariant?.id ?? null}
                  disabled={controlsDisabled}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <BagIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Add to cart
                </AddToCartButton>
              </motion.div>
              <motion.div
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="w-full"
              >
                <OrderNowButton
                  product={product}
                  variantId={directVariant?.id ?? null}
                  disabled={controlsDisabled}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-electric/40 hover:bg-electric-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Buy now
                </OrderNowButton>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
