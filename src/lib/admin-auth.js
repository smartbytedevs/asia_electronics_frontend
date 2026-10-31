import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  BackendAccessTokenError,
  getBackendAccessToken,
} from "@/lib/backend-auth";
import { ApiClientError, apiClient } from "@/lib/api-client";

/**
 * Roles allowed to access the admin area. ADMIN and STAFF are the only roles
 * that may render the admin shell.
 */
const ADMIN_ROLES = new Set(["ADMIN", "STAFF"]);

const MESSAGES = {
  TOKEN:
    "We could not obtain a backend access token from your session. Please sign out and sign in again.",
  PROFILE: "The backend did not return a valid profile for your account.",
  UNEXPECTED:
    "Something went wrong while contacting the backend. Please try again later.",
};

/**
 * Server-side admin authorization boundary (RBAC gate).
 *
 * Runs for every request in the /admin area and returns a discriminated
 * result:
 *
 *   { status: "authorized", user }  — session + backend role ADMIN/STAFF
 *   { status: "forbidden" }         — authenticated, but role is not ADMIN/STAFF
 *   { status: "error", message }    — backend unreachable / verification failed
 *
 * No session → redirects to /login (throws, so it never returns).
 *
 * Security:
 * - The authoritative role is read from the backend `GET /api/v1/me`
 *   response, which the backend resolves from the MongoDB User record. The
 *   role is NEVER read from the Better Auth session, JWT claims, URL
 *   parameters, cookies, or client state.
 * - Wrapped in React `cache()` so the layout and pages of the same request
 *   share one /me call (no duplicated backend requests).
 */
export const getAdminAccess = cache(async function getAdminAccess() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/login");
  }

  try {
    const token = await getBackendAccessToken({ headers: requestHeaders });
    const response = await apiClient.get("/me", { token });
    const user = response?.data?.user ?? null;

    if (!user || typeof user.role !== "string") {
      return { status: "error", message: MESSAGES.PROFILE };
    }

    if (!ADMIN_ROLES.has(user.role)) {
      return { status: "forbidden" };
    }

    return { status: "authorized", user };
  } catch (err) {
    // ApiClientError and BackendAccessTokenError messages are safe,
    // pre-mapped, user-facing strings (see src/lib/api-client.js and
    // src/lib/backend-auth.js). Raw backend errors and tokens are never
    // forwarded.
    if (err instanceof ApiClientError || err instanceof BackendAccessTokenError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: MESSAGES.UNEXPECTED };
  }
});
