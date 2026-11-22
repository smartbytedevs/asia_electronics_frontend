/**
 * Best-effort Meta Pixel event bridge.
 *
 * The Pixel base code (root layout) only defines `window.fbq` when an ID is
 * saved, so this helper silently does nothing when tracking is disabled,
 * blocked, or running on the server. Errors are swallowed: analytics must
 * never break shopping, checkout, or order placement.
 */
export function trackEvent(name, params) {
  try {
    if (typeof window === "undefined") {
      return;
    }
    if (typeof window.fbq !== "function") {
      return;
    }
    window.fbq("track", name, params);
  } catch {
    // Tracking is optional — never propagate.
  }
}
