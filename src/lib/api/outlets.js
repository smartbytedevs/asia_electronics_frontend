import { backendRequest } from "./http";

/**
 * Outlets module.
 * @see backend src/modules/outlets/outlet.routes.js
 */

/**
 * GET /outlets — public list of ACTIVE outlets.
 * Returns `data.outlets` with `{ id, name, code, address, phone, isActive }`.
 */
export async function getOutlets() {
  return backendRequest("/outlets");
}
