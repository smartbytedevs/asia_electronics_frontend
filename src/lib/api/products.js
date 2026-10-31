import { backendRequest, withQuery } from "./http";

/**
 * Storefront catalog filters (backend allowlist).
 * @see backend src/modules/products/product.routes.js
 */
export const PRODUCT_FILTERS = ["categoryId", "featured", "newArrival", "bestDeal"];
export const PRODUCT_SORTS = ["newest", "priceAsc", "priceDesc", "featured"];

/**
 * GET /products — paginated card list. Public.
 *
 * The backend list is the ONLY product-list endpoint (there is no admin
 * variant), and it always filters to ACTIVE products — inactive products
 * therefore cannot be listed or re-read, only deactivated via
 * `updateProduct(id, { isActive: false })`.
 *
 * @param {object} [params] categoryId, featured, newArrival, bestDeal, sort, page, limit
 */
export async function getProducts(params) {
  return backendRequest(withQuery("/products", params));
}

/**
 * GET /products/slug/:slug — full product by slug. Public.
 */
export async function getProductBySlug(slug) {
  return backendRequest(`/products/slug/${encodeURIComponent(slug)}`);
}

/**
 * GET /products/:id — full product by id. Public.
 *
 * Public detail hides inactive variants and purchase-price fields, and returns
 * 404 for inactive products. The create/update responses are the only admin
 * view (they include purchase price + inactive variants).
 */
export async function getProduct(id) {
  return backendRequest(`/products/${encodeURIComponent(id)}`);
}

/**
 * GET /products/:id/availability — public, ACTIVE product only.
 *
 * Returns per-variant storefront availability computed by the backend:
 *   availableQuantity = availableOnlineQuantity (online - reserved)
 * plus `isOutOfStock`. A variant with no inventory record is out of stock.
 * Exposes NO admin-only inventory data (no offline stock, movements,
 * reservations, or costs). Used by the product detail page to drive the
 * quantity stepper and Add to Bag.
 */
export async function getProductAvailability(id) {
  return backendRequest(`/products/${encodeURIComponent(id)}/availability`);
}

/**
 * POST /products — create product with initial variants. ADMIN/STAFF only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function createProduct(body) {
  return backendRequest("/products", { method: "POST", body });
}

/**
 * PATCH /products/:id — update product (incl. variant replacement,
 * deactivation via `{ isActive: false }`). ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function updateProduct(id, body) {
  return backendRequest(`/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}
