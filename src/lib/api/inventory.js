import { backendRequest, withQuery } from "./http";

/**
 * Inventory module. All endpoints are ADMIN-only.
 *
 * A stock subject is either a ProductVariant (`productId` +
 * `productVariantId`) or a Simple Product (`productId` with
 * `productVariantId: null`). Mutation bodies carry both fields; the backend
 * resolves the subject and, for legacy variant-only input, the owning product.
 * The read-detail endpoints below are variant-scoped.
 * @see backend src/modules/inventory/inventory.routes.js
 */

/**
 * GET /inventory — paginated inventory list.
 * @param {object} [params] page, limit
 */
export async function getInventory(params) {
  return backendRequest(withQuery("/inventory", params));
}

/**
 * GET /inventory/low-stock — items at or below the low-stock threshold.
 */
export async function getLowStock() {
  return backendRequest("/inventory/low-stock");
}

/**
 * GET /inventory/:productVariantId — inventory record for a variant.
 */
export async function getInventoryByVariant(productVariantId) {
  return backendRequest(
    `/inventory/${encodeURIComponent(productVariantId)}`
  );
}

/**
 * GET /inventory/:productVariantId/movements — stock movement ledger.
 * @param {string} productVariantId
 * @param {object} [params] page, limit
 */
export async function getInventoryMovements(productVariantId, params) {
  return backendRequest(
    withQuery(
      `/inventory/${encodeURIComponent(productVariantId)}/movements`,
      params
    )
  );
}

/**
 * POST /inventory/initialize — initialize stock for a product or variant.
 * ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 * @param {object} body { productId, productVariantId (null for a Simple
 *   Product), outletId?, onlineQuantity?, offlineQuantity?, lowStockThreshold? }
 */
export async function initializeInventory(body) {
  return backendRequest("/inventory/initialize", { method: "POST", body });
}

/**
 * POST /inventory/stock-in — add stock. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 * @param {object} body { productId, productVariantId, location, quantity, reason? }
 */
export async function addStock(body) {
  return backendRequest("/inventory/stock-in", { method: "POST", body });
}

/**
 * POST /inventory/stock-out — remove stock. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 * @param {object} body { productId, productVariantId, location, quantity, reason? }
 */
export async function removeStock(body) {
  return backendRequest("/inventory/stock-out", { method: "POST", body });
}

/**
 * POST /inventory/transfer — move stock between locations. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 * @param {object} body { productId, productVariantId, fromLocation, toLocation, quantity, reason? }
 */
export async function transferStock(body) {
  return backendRequest("/inventory/transfer", { method: "POST", body });
}

/**
 * POST /inventory/adjust — correct stock with an adjustment movement. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 * @param {object} body { productId, productVariantId, location, quantity, reason? }
 */
export async function adjustStock(body) {
  return backendRequest("/inventory/adjust", { method: "POST", body });
}
