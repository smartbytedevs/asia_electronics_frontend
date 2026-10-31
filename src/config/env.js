const DEFAULT_AUTH_BASE_PATH = "/api/auth";

// Safe local-development defaults. They are used ONLY outside production when
// the corresponding variable is missing, so a missing value can never fall
// back to a hosted deployment (which could belong to another store).
const LOCAL_DEV_API_URL = "http://localhost:8080/api/v1";
const LOCAL_DEV_ORIGIN = "http://localhost:3000";

const isProduction = process.env.NODE_ENV === "production";

function normalizeBaseUrl(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : "";
}

function resolveRequiredUrl(name, value, devFallback) {
  const normalized = normalizeBaseUrl(value);
  if (normalized) {
    return normalized;
  }

  if (!isProduction && devFallback) {
    console.warn(
      `[env] ${name} is not set; using the local development default ${devFallback}. ` +
        "Set it explicitly in .env.local (see .env.example)."
    );
    return devFallback;
  }

  throw new Error(
    `${name} is not set. Add it to the environment (see .env.example). ` +
      "Refusing to fall back to a hosted default because that could target another store's production services."
  );
}

function parseOrigins(value) {
  const raw = value?.trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Server-side environment configuration.
 *
 * Do not import this module from client components: BETTER_AUTH_URL and
 * BETTER_AUTH_BASE_PATH are server-only variables and are not inlined into the
 * browser bundle. The browser auth client (`src/lib/auth-client.js`) resolves
 * its own origin from NEXT_PUBLIC_BETTER_AUTH_URL / window.location.origin.
 */
export const env = {
  api: {
    baseUrl: resolveRequiredUrl(
      "NEXT_PUBLIC_API_URL",
      process.env.NEXT_PUBLIC_API_URL,
      LOCAL_DEV_API_URL
    ),
  },
  auth: {
    baseUrl: resolveRequiredUrl(
      "BETTER_AUTH_URL",
      process.env.BETTER_AUTH_URL,
      LOCAL_DEV_ORIGIN
    ),
    basePath:
      normalizeBaseUrl(process.env.BETTER_AUTH_BASE_PATH) ||
      DEFAULT_AUTH_BASE_PATH,
    // Additional browser origins Better Auth treats as trusted for cookies /
    // CSRF checks (comma-separated in BETTER_AUTH_TRUSTED_ORIGINS). Better Auth
    // also auto-reads that env var itself; listing it here keeps the allowlist
    // explicit. The canonical origin is derived from baseUrl automatically.
    trustedOrigins: parseOrigins(process.env.BETTER_AUTH_TRUSTED_ORIGINS),
  },
};
