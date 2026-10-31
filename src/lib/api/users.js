import { backendRequest } from "./http";

/**
 * Users module. The only user-facing endpoint is the current user's own
 * profile (`GET /api/v1/me`). There is no user CRUD API in the backend.
 */
export async function getCurrentUser() {
  return backendRequest("/me");
}
