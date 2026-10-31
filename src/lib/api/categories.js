import { backendRequest } from "./http";

/**
 * GET /categories — active categories. Public.
 *
 * The backend list is the ONLY category-list endpoint (no admin variant, no
 * pagination or search), and it always returns ACTIVE categories only. There
 * is no endpoint to list/read an inactive category, so deactivation via
 * `updateCategory(id, { isActive: false })` removes it from the admin list too.
 */
export async function getCategories() {
  return backendRequest("/categories");
}

/**
 * GET /categories/slug/:slug — category by slug. Public.
 */
export async function getCategoryBySlug(slug) {
  return backendRequest(`/categories/slug/${encodeURIComponent(slug)}`);
}

/**
 * GET /categories/:id — category by id. Public.
 */
export async function getCategory(id) {
  return backendRequest(`/categories/${encodeURIComponent(id)}`);
}

/**
 * POST /categories — create category (slug auto-generated). ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function createCategory(body) {
  return backendRequest("/categories", { method: "POST", body });
}

/**
 * PATCH /categories/:id — update category. ADMIN only.
 * (Write endpoint; excluded from the read-only API testing phase.)
 */
export async function updateCategory(id, body) {
  return backendRequest(`/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}
