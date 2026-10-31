const LOCAL_DEV_SITE_URL = "https://asia-electronics-frontend.vercel.app";

/**
 * Canonical site URL used for metadata, canonical links and JSON-LD.
 *
 * `NEXT_PUBLIC_SITE_URL` must be set for production deployments. When it is
 * missing, production fails loudly instead of publishing another store's
 * domain, while local development falls back to localhost.
 */
function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[seo] NEXT_PUBLIC_SITE_URL is not set; using the local development default ${LOCAL_DEV_SITE_URL}. ` +
        "Set it explicitly in .env.local (see .env.example)."
    );
    return LOCAL_DEV_SITE_URL;
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL is not set. Add it to the environment (see .env.example). " +
      "Refusing to publish canonical URLs for a different domain."
  );
}

export const SITE_URL = resolveSiteUrl();

/**
 * Resolves a site-relative or absolute path against the canonical domain.
 * Absolute remote URLs (product images, etc.) pass through untouched.
 */
export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Absolute URLs for JSON-LD `image` arrays, keeping only real entries. */
export function absoluteImageUrls(urls = []) {
  return urls
    .filter(Boolean)
    .map((url) => absoluteUrl(url))
    .filter((url, index, all) => all.indexOf(url) === index)
    .slice(0, 3);
}
