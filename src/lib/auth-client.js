import { createAuthClient } from "better-auth/react";

/**
 * Browser-side Better Auth client.
 *
 * The browser must call the origin that actually serves this app, and the
 * backend must see that same origin as the JWT issuer/audience. Server-only
 * variables such as BETTER_AUTH_URL are NOT available in the browser bundle,
 * so this module must never read them: doing so made the client silently fall
 * back to a hardcoded production domain.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_BETTER_AUTH_URL (explicit, inlined at build time)
 *   2. window.location.origin (the origin currently serving the page)
 *   3. nothing on the server, where Better Auth resolves BETTER_AUTH_URL itself
 *
 * The base path mirrors BETTER_AUTH_BASE_PATH via its public counterpart and
 * defaults to the Better Auth default when unset.
 */
const explicitBaseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
const normalizedBaseUrl = explicitBaseUrl
  ? explicitBaseUrl.replace(/\/+$/, "")
  : "";

const resolvedBaseUrl =
  normalizedBaseUrl ||
  (typeof window !== "undefined" ? window.location.origin : undefined);

const resolvedBasePath =
  process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_PATH?.trim().replace(/\/+$/, "") ||
  "/api/auth";

export const authClient = createAuthClient({
  ...(resolvedBaseUrl ? { baseURL: resolvedBaseUrl } : {}),
  basePath: resolvedBasePath,
});
