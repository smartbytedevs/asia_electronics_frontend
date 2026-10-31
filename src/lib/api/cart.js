import { backendRequest } from "./http";

/**
 * Cart module — the customer's server-side bag.
 * @see backend src/modules/cart/cart.routes.js
 *
 * The backend cart stores only variant references + quantities; prices and
 * availability are derived live from the catalog at read time and recomputed
 * authoritatively at checkout. Every endpoint is CUSTOMER-scoped and returns
 * `data: { cart }` with the serialized cart.
 */

/**
 * GET /cart — the current customer's cart (created empty on demand).
 */
export async function getCart() {
  return backendRequest("/cart");
}

/**
 * POST /cart/items — add (or bump) a line.
 *
 * Variant products send `productVariantId` + quantity (the backend merges by
 * productVariantId + selectedSize). Simple products (no active variants) send
 * `productId` with `productVariantId: null`. When a size has been chosen it is
 * sent as `selectedSize` so multi-size variants resolve to exactly one size.
 *
 * @param {object} input { productId, productVariantId, quantity, selectedSize }
 */
export async function addCartItem({ productId, productVariantId, quantity, selectedSize = null }) {
  const body =
    productVariantId != null
      ? { productVariantId, quantity, selectedSize }
      : { productId, productVariantId: null, quantity, selectedSize };
  return backendRequest("/cart/items", {
    method: "POST",
    body,
  });
}

/**
 * PATCH /cart/items/:id — set a line's absolute quantity.
 * @param {string} itemId - backend cart-item id.
 * @param {number} quantity - positive integer (1..CART_LIMITS.QUANTITY_MAX).
 */
export async function updateCartItem(itemId, quantity) {
  return backendRequest(`/cart/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: { quantity },
  });
}

/**
 * DELETE /cart/items/:id — remove a single line.
 */
export async function removeCartItem(itemId) {
  return backendRequest(`/cart/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

/**
 * DELETE /cart — clear every line (idempotent).
 */
export async function clearCart() {
  return backendRequest("/cart", { method: "DELETE" });
}
