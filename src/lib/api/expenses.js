import { backendRequest, withQuery } from "./http";

/**
 * Expenses module — append-only finance ledger. All endpoints are ADMIN-only.
 * @see backend src/modules/expenses/expense.routes.js
 */

/**
 * GET /admin/expenses — paginated expense list.
 * Supports `category`, `dateFrom`, `dateTo`, `page`, `limit`. Returns
 * payload.data: { expenses: [...], pagination: { page, limit, total,
 * totalPages } }.
 * @param {object} [params] category, dateFrom, dateTo, page, limit
 */
export async function getAdminExpenses(params) {
  return backendRequest(withQuery("/admin/expenses", params));
}

/**
 * GET /admin/expenses/:id — single expense. ADMIN only.
 * @param {string} id
 */
export async function getAdminExpense(id) {
  return backendRequest(`/admin/expenses/${encodeURIComponent(id)}`);
}

/**
 * POST /admin/expenses — create an expense line. ADMIN only.
 *
 * The body accepts exactly what the backend contract allows:
 * `amountMinorUnits` (positive integer, required), `description` (required),
 * `category` (optional) and `expenseDate` (optional ISO date). `createdBy` is
 * NEVER sent — the backend derives the acting admin from the session.
 *
 * @param {object} payload { amountMinorUnits, description, category?, expenseDate? }
 */
export async function createExpense(payload) {
  return backendRequest("/admin/expenses", { method: "POST", body: payload });
}
