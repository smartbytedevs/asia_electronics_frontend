const LOCAL_DEV_SITE_URL = "http://localhost:3000";
const PRODUCTION_SITE_URL = "https://www.asiaelectronicsonline.com";

export const SITE_NAME = "Asia Electronics";
export const SITE_DESCRIPTION =
  "Shop genuine speakers, sound boxes, torch lights, fans, trimmers and grooming devices at Asia Electronics. Official warranty and delivery across Chittagong and Bangladesh.";

/**
 * Normalizes the configured site URL to the canonical HTTPS/www origin.
 * The apex `asiaelectronicsonline.com` host is always rewritten to `www`.
 */
function normalizeSiteUrl(value) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.hostname === "asiaelectronicsonline.com") {
      url.hostname = "www.asiaelectronicsonline.com";
    }
    if (
      url.protocol !== "https:" &&
      !/^(localhost|127\.0\.0\.1)$/i.test(url.hostname)
    ) {
      url.protocol = "https:";
    }
    return url.origin;
  } catch {
    return trimmed;
  }
}

function isLocalSiteUrl(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);
}

/**
 * Canonical site URL used for metadata, canonical links, sitemap, robots and
 * JSON-LD. Production always resolves to the official www domain: an apex
 * domain is rewritten, and a missing/local value falls back to the official
 * production origin instead of publishing localhost URLs.
 */
function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const normalized = normalizeSiteUrl(configured);
    if (process.env.NODE_ENV === "production" && isLocalSiteUrl(normalized)) {
      console.warn(
        `[seo] NEXT_PUBLIC_SITE_URL points to a local address; using ${PRODUCTION_SITE_URL}.`
      );
      return PRODUCTION_SITE_URL;
    }
    return normalized;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[seo] NEXT_PUBLIC_SITE_URL is not set; using the local development default ${LOCAL_DEV_SITE_URL}. ` +
        "Set it explicitly in .env.local (see .env.example)."
    );
    return LOCAL_DEV_SITE_URL;
  }

  console.warn(
    `[seo] NEXT_PUBLIC_SITE_URL is not set; using ${PRODUCTION_SITE_URL}.`
  );
  return PRODUCTION_SITE_URL;
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
