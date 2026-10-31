import { auth } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";

export class BackendAccessTokenError extends Error {
  constructor(
    message = "Could not obtain a backend access token from your session."
  ) {
    super(message);
    this.name = "BackendAccessTokenError";
  }
}

/**
 * Obtains the JWT to send to the Taqwa backend for the current Better Auth
 * session.
 *
 * The token is minted server-side by Better Auth (GET /api/auth/token). The
 * frontend never signs JWTs itself, never accesses the Better Auth private
 * key, and never reads BETTER_AUTH_SECRET. The token is returned to the
 * caller only; it is never logged or persisted.
 *
 * @param {object} args
 * @param {Headers} args.headers - Request headers (used for the session cookie).
 * @returns {Promise<string>} The signed JWT.
 * @throws {BackendAccessTokenError} If the token cannot be obtained.
 */
export async function getBackendAccessToken({ headers } = {}) {
  if (!headers) {
    throw new BackendAccessTokenError(
      "Request headers are required to obtain a backend access token."
    );
  }

  let result;
  try {
    result = await auth.api.getToken({ headers });
  } catch {
    throw new BackendAccessTokenError();
  }

  const token = result?.token;
  if (typeof token !== "string" || token.length === 0) {
    throw new BackendAccessTokenError();
  }

  return token;
}

/**
 * Authenticated request to the Taqwa backend: acquires the Better Auth JWT
 * for the current session, then sends it as `Authorization: Bearer <token>`.
 *
 * @param {string} path - API path, e.g. "/me".
 * @param {object} [args]
 * @param {Headers} [args.headers] - Request headers (session cookie).
 * @param {object} [args.options] - Extra options forwarded to `apiClient.get`.
 * @returns {Promise<object>} The parsed JSON response envelope.
 */
export async function authenticatedRequest(path, { headers, options } = {}) {
  const token = await getBackendAccessToken({ headers });
  return apiClient.get(path, { ...options, token });
}
