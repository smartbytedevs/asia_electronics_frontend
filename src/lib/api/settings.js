import { backendRequest } from "./http";

/**
 * GET /settings — public application settings (Meta Pixel ID).
 */
export async function getSettings() {
  return backendRequest("/settings");
}

/**
 * PUT /settings — update application settings. ADMIN only.
 */
export async function updateSettings(body) {
  return backendRequest("/settings", { method: "PUT", body });
}
