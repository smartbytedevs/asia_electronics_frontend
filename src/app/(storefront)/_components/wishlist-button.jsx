"use client";

import { useWishlist } from "./wishlist-context";
import { HeartIcon } from "./icons";

/**
 * Wishlist trigger with a live saved-count badge. Opens the wishlist drawer.
 */
export function WishlistButton() {
  const { ids, openWishlist } = useWishlist();
  const count = ids.length;

  return (
    <button
      type="button"
      onClick={openWishlist}
      aria-label={`Open wishlist (${count} item${count === 1 ? "" : "s"})`}
      className="relative rounded-full p-2 text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
    >
      <HeartIcon />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-electric px-1 text-[0.6rem] font-bold leading-none text-white">
          {count > 99 ? "99" : count}
        </span>
      ) : null}
    </button>
  );
}
