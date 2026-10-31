"use client";

import { useCart } from "./cart-context";
import { BagIcon } from "./icons";

/**
 * Shopping-cart trigger with a live item-count badge. A navy pill keeps the
 * primary purchase action visible at every breakpoint.
 */
export function CartButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart (${itemCount} item${itemCount === 1 ? "" : "s"})`}
      className="relative inline-flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50 sm:px-4"
    >
      <BagIcon className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">Cart</span>
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-electric px-1 text-[0.6rem] font-bold leading-none text-white ring-2 ring-white">
          {itemCount > 99 ? "99" : itemCount}
        </span>
      ) : null}
    </button>
  );
}
