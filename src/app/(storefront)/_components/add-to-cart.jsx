"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { buildCartEntry, useCart } from "./cart-context";
import { MinusIcon, PlusIcon } from "./icons";
import { ProductContactButtons } from "./product-contact-buttons";
import { getProductAvailability } from "@/lib/api/products";
import { formatMinorUnits } from "@/lib/utils";

const MAX_QUANTITY = 99;
const EASE = [0.22, 1, 0.36, 1];

export function QuantityStepper({ value, onChange, disabled = false, max = MAX_QUANTITY }) {
  const canIncrease = !disabled && value < max;
  const canDecrease = !disabled && value > 1;

  return (
    <div className="inline-flex items-center rounded-full border border-sand bg-white justify-center">
      <button
        type="button"
        disabled={!canDecrease}
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Decrease quantity"
        className="rounded-l-full p-3 text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MinusIcon />
      </button>
      <span className="w-10 text-center text-sm tabular-nums text-ink">{value}</span>
      <button
        type="button"
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
        className="rounded-r-full p-3 text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PlusIcon />
      </button>
    </div>
  );
}

/**
 * Adds a product (optionally a specific variant + selected size + quantity) to
 * the bag.
 */
export function AddToCartButton({ product, variantId = null, selectedSize = null, quantity = 1, className = "", children, disabled = false }) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addItem(buildCartEntry(product, variantId, quantity, selectedSize))}
      className={
        (className ||
          "inline-flex w-full items-center justify-center rounded-full bg-ink px-8 py-3.5 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60") +
        " disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {children ?? "Add to cart"}
    </button>
  );
}

function variantLabel(variant) {
  return Object.values(variant.attributes ?? {})
    .filter(Boolean)
    .join(" · ");
}

const SIZE_ATTRIBUTE = /^size$/i;

/**
 * The size value of a variant, read from its `attributes` under a case-
 * insensitive "size" key (e.g. `{ size: "52" }` or `{ Size: "L, M, S" }`).
 * Returns null when the variant carries no size attribute. Sizes come from the
 * API only — never invented or hardcoded here.
 */
function variantSize(variant) {
  const attributes = variant.attributes || {};
  const key = Object.keys(attributes).find((k) => SIZE_ATTRIBUTE.test(k.trim()));
  if (!key) {
    return null;
  }
  const value = String(attributes[key] ?? "").trim();
  return value || null;
}

/** Splits a multi-size value like "L, M, S" / "52/54" into individual sizes. */
function splitSizes(value) {
  return value
    .split(/\s*[,/&]\s*/)
    .map((size) => size.trim())
    .filter(Boolean);
}

/**
 * Flattens every active variant's size attribute into selectable size options.
 * Each option keeps a reference to its owning variant so a size always selects
 * the correct variant. Duplicate size tokens are collapsed (first wins).
 *
 * Exported so the product card can detect products that need a size selection
 * before adding to the bag.
 */
export function buildSizeOptions(variants) {
  const options = [];
  const seen = new Set();
  for (const variant of variants) {
    const size = variantSize(variant);
    if (!size) {
      continue;
    }
    for (const token of splitSizes(size)) {
      const dedupeKey = token.toLowerCase();
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      options.push({ size: token, variantId: variant.id });
    }
  }
  return options;
}

/**
 * Live storefront availability for one product — the single source of truth
 * for stock across the product detail panel and the product cards.
 *
 * Calls the backend's public `/products/:id/availability` and indexes the
 * per-variant results by variant id, alongside the product-level availability
 * used by simple products (no active variants). A variant missing from the
 * response is treated as out of stock — the exact rule the backend applies.
 *
 * `availability.status` is `"loading" | "ready" | "failed"`. When `"ready"`,
 * `availability.map` maps `variantId -> { isOutOfStock, availableQuantity, … }`
 * and `availability.product` carries the product-level flags.
 */
export function useProductAvailability(productId) {
  const [attempt, setAttempt] = useState(0);
  const [availability, setAvailability] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getProductAvailability(productId).then((res) => {
      if (cancelled) {
        return;
      }
      const data = res?.payload?.data;
      const variants = Array.isArray(data?.variants) ? data.variants : null;
      const productLevel =
        data?.product && typeof data.product === "object" ? data.product : null;
      if (res.ok && (Array.isArray(variants) || productLevel)) {
        const map = {};
        for (const entry of variants ?? []) {
          if (entry && entry.variantId) {
            map[entry.variantId] = entry;
          }
        }
        setAvailability({ status: "ready", map, product: productLevel });
      } else {
        setAvailability({ status: "failed" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productId, attempt]);

  const retry = useCallback(() => {
    setAvailability({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return { availability, retry };
}

/**
 * "Order now" — stashes the current bag, swaps it for the chosen piece, and
 * routes straight to checkout. Resolves only after the bag is ready; the
 * prior bag is restored once the order is placed or checkout is abandoned.
 */
export function useOrderNow() {
  const router = useRouter();
  const { beginBuyNow } = useCart();

  const orderNow = useCallback(
    async (product, variantId = null, selectedSize = null, quantity = 1) => {
      const ready = await beginBuyNow(
        buildCartEntry(product, variantId, quantity, selectedSize)
      );
      if (ready) {
        router.push("/checkout");
      }
    },
    [beginBuyNow, router]
  );

  return orderNow;
}

/**
 * "Order now" button — the same stock-validated, size-aware flow as
 * AddToCartButton, but it replaces the bag with the chosen piece and routes
 * straight to checkout. Disabled whenever the underlying controls would be.
 */
export function OrderNowButton({ product, variantId = null, selectedSize = null, quantity = 1, className = "", children, disabled = false }) {
  const orderNow = useOrderNow();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => orderNow(product, variantId, selectedSize, quantity)}
      className={
        (className ||
          "inline-flex w-full items-center justify-center rounded-full border border-ink/15 bg-white px-8 py-3.5 text-sm font-semibold tracking-wide text-ink transition-colors hover:border-electric/40 hover:bg-electric-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40") +
        " disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {children ?? "Buy now"}
    </button>
  );
}

/**
 * Purchase panel for the product detail page: size picker (built from each
 * active variant's `attributes.size` — even a single-variant product shows its
 * sizes), quantity stepper, add-to-bag and order-now. The shown price follows
 * the selected variant's effective selling price (or the product price for
 * simple products with no variants).
 *
 * Availability comes from the backend's public `/products/:id/availability`
 * endpoint (availableQuantity = online - reserved). Variant products cap the
 * quantity stepper per variant and disable the buttons when the variant is out
 * of stock. Simple products (no active variants) use the product-level
 * availability the endpoint returns under `data.product` and send the product
 * id (with `productVariantId: null`) when added. Quantities are always capped
 * by the real available quantity — never derived or hardcoded on the client.
 *
 * "Order now" swaps the bag for the chosen piece and routes straight to
 * checkout (the previous bag is restored afterwards).
 */
export function ProductPurchase({ product }) {
  const activeVariants = (product.variants || []).filter((v) => v.isActive);
  const hasActiveVariants = activeVariants.length > 0;
  const sizeOptions = buildSizeOptions(activeVariants);
  const hasSizeOptions = sizeOptions.length > 0;
  const [variantId, setVariantId] = useState(
    sizeOptions[0]?.variantId ?? activeVariants[0]?.id ?? null
  );
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]?.size ?? null);
  const [quantity, setQuantity] = useState(1);
  const { availability } = useProductAvailability(product.id);
  const orderNow = useOrderNow();

  const selected =
    activeVariants.find((v) => v.id === variantId) || activeVariants[0] || null;

  const availabilityReady = availability.status === "ready";
  const availabilityLoading = availability.status === "loading";
  const availabilityMap = availabilityReady ? availability.map : null;
  const productAvailability = availabilityReady ? availability.product : null;

  const selectedAvailability =
    selected && availabilityMap ? availabilityMap[selected.id] : null;
  const isOutOfStock = hasActiveVariants
    ? availabilityReady && selected
      ? Boolean(selectedAvailability ? selectedAvailability.isOutOfStock : true)
      : false
    : availabilityReady
      ? Boolean(productAvailability ? productAvailability.isOutOfStock : true)
      : false;

  const maxQuantity = hasActiveVariants
    ? availabilityReady && selected && selectedAvailability
      ? selectedAvailability.availableQuantity ?? 0
      : MAX_QUANTITY
    : availabilityReady && productAvailability
      ? productAvailability.availableQuantity ?? 0
      : MAX_QUANTITY;

  const cappedQuantity = Math.max(1, Math.min(quantity, maxQuantity));

  const priceMinorUnits =
    selected?.effectiveSellingPrice ?? product.effectiveSellingPrice ?? product.sellingPrice;
  const compareAtMinorUnits = selected?.sellingPrice ?? product.sellingPrice;
  const isDiscounted = compareAtMinorUnits > priceMinorUnits;
  // Backend serializes discount.type in lowercase ("percentage"/"fixed").
  const pct =
    typeof product.discount?.type === "string" &&
    product.discount.type.toLowerCase() === "percentage"
      ? product.discount.value
      : null;

  const controlsDisabled = hasActiveVariants
    ? !availabilityLoading && Boolean(isOutOfStock)
    : !availabilityReady || Boolean(isOutOfStock);

  const availableQuantity = hasActiveVariants
    ? selectedAvailability?.availableQuantity
    : productAvailability?.availableQuantity;

  let status;
  if (availability.status === "loading") {
    status = (
      <p className="mt-3 text-xs italic text-muted">Checking availability…</p>
    );
  } else if (availability.status === "failed") {
    status = (
      <p className="mt-3 text-sm font-medium text-[#c9604d]">
        Availability unavailable
      </p>
    );
  } else if (hasActiveVariants && !selected) {
    status = (
      <p className="mt-3 text-sm font-medium text-[#c9604d]">
        This product is currently unavailable.
      </p>
    );
  } else if (hasActiveVariants && (!availabilityMap || !selectedAvailability)) {
    status = (
      <p className="mt-3 text-xs text-muted">
        Ships from Dhaka within 1–2 working days.
      </p>
    );
  } else if (isOutOfStock) {
    status = (
      <p className="mt-3 text-sm font-medium text-[#c9604d]">Out of stock</p>
    );
  } else {
    status = (
      <p className="mt-3 text-xs text-muted">
        {availableQuantity} in stock
      </p>
    );
  }

  return (
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-ink">
            {formatMinorUnits(priceMinorUnits)}
          </span>
          {isDiscounted ? (
            <>
              <span className="text-base text-muted line-through">
                {formatMinorUnits(compareAtMinorUnits)}
              </span>
              {pct ? (
                <span className="rounded-full bg-gold-soft/60 px-2.5 py-0.5 text-xs font-semibold text-mocha-deep">
                  −{pct}%
                </span>
              ) : null}
            </>
          ) : null}
        </div>

        {hasSizeOptions || activeVariants.length > 1 ? (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Choose option
              </p>
              {selected?.sku ? (
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                  SKU:{" "}
                  <span className="font-semibold text-mocha-deep">
                    {selected.sku}
                  </span>
                </p>
              ) : null}
            </div>
            <div
              role="radiogroup"
              aria-label="Option"
              className="mt-3 flex flex-wrap gap-2"
            >
              {hasSizeOptions
                ? sizeOptions.map((option) => {
                    const isSelected = option.size === selectedSize;
                    return (
                      <button
                        key={`${option.variantId}-${option.size}`}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          setSelectedSize(option.size);
                          setVariantId(option.variantId);
                          setQuantity(1);
                        }}
                        className={
                          "relative inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 " +
                          (isSelected
                            ? "border-ink bg-ink font-medium text-cream"
                            : "border-sand bg-white text-muted hover:border-ink/30 hover:text-ink")
                        }
                      >
                        {isSelected ? (
                          <motion.span
                            layoutId="variant-selected-dot"
                            transition={{ type: "tween", duration: 0.25, ease: EASE }}
                            aria-hidden="true"
                            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold"
                          />
                        ) : null}
                        {option.size}
                      </button>
                    );
                  })
                : activeVariants.map((variant) => {
                    const isSelected = variant.id === selected?.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          setVariantId(variant.id);
                          setQuantity(1);
                        }}
                        className={
                          "relative inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 " +
                          (isSelected
                            ? "border-ink bg-ink font-medium text-cream"
                            : "border-sand bg-white text-muted hover:border-ink/30 hover:text-ink")
                        }
                      >
                        {isSelected ? (
                          <motion.span
                            layoutId="variant-selected-dot"
                            transition={{ type: "tween", duration: 0.25, ease: EASE }}
                            aria-hidden="true"
                            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold"
                          />
                        ) : null}
                        {variantLabel(variant) || "Default"}
                      </button>
                    );
                  })}
            </div>
          </div>
        ) : selected?.sku ? (
          <p className="mt-5 text-[0.65rem] uppercase tracking-[0.14em] text-muted">
            SKU:{" "}
            <span className="font-semibold text-mocha-deep">{selected.sku}</span>
          </p>
        ) : null}

        <div className="mt-7">
          <div className="mb-3 flex">
            <QuantityStepper
              value={cappedQuantity}
              onChange={setQuantity}
              disabled={controlsDisabled}
              max={maxQuantity}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="w-full"
            >
              <AddToCartButton
                product={product}
                variantId={selected?.id ?? null}
                selectedSize={selectedSize ?? null}
                quantity={cappedQuantity}
                disabled={controlsDisabled}
                className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-ink px-4 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50 sm:px-6"
              >
                Add to cart
              </AddToCartButton>
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="w-full"
            >
              <OrderNowButton
                product={product}
                variantId={selected?.id ?? null}
                selectedSize={selectedSize ?? null}
                quantity={cappedQuantity}
                disabled={controlsDisabled}
                className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-ink/15 bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-ink transition-colors hover:border-electric/40 hover:bg-electric-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 sm:px-6"
              >
                Buy now
              </OrderNowButton>
            </motion.div>
            <ProductContactButtons productName={product.name} bare />
          </div>
        </div>
        {status}
      </div>
  );
}
