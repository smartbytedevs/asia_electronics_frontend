import { backendRequest, withQuery } from "./http";

/**
 * Analytics module — read-only admin dashboard metrics.
 * @see backend src/modules/analytics/analytics.routes.js
 *
 * Both endpoints accept optional `dateFrom`/`dateTo` ISO-8601 params. When
 * neither is given the backend defaults to a trailing 30-day window ending
 * now. All money values are integer minor units (never floats).
 */

/**
 * GET /admin/analytics/summary — period totals. ADMIN only.
 * Returns payload.data: { range: {from, to}, totalOrders,
 * totalSalesMinorUnits, totalRefundsMinorUnits, totalExpensesMinorUnits,
 * netMinorUnits, orderStatusCounts }.
 * @param {object} [params] dateFrom, dateTo
 */
export async function getAnalyticsSummary(params) {
  return backendRequest(withQuery("/admin/analytics/summary", params));
}

/**
 * GET /admin/analytics/daily — zero-filled daily series. ADMIN only.
 * Returns payload.data: { range: {from, to}, daily: [{ date, orders, sales,
 * refunds, expenses, net }] }.
 * @param {object} [params] dateFrom, dateTo
 */
export async function getAnalyticsDaily(params) {
  return backendRequest(withQuery("/admin/analytics/daily", params));
}
