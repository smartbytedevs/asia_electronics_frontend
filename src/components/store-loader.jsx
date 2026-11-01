import { BrandLogoImage } from "@/components/brand-logo";

/**
 * StoreLoader
 *
 * The single, brand-consistent loading state used by every App Router loading
 * boundary across the site — root, storefront and admin. A quiet Asia
 * Electronics brand moment: the supplied logo sits at the centre of a sweeping
 * electric ring, above a thin progress light and a pulsing dot.
 *
 * Pure CSS animation (no JavaScript), so the streaming fallback stays
 * hydration-safe and paints immediately. Nothing here is a splash screen —
 * it is only the route/navigation fallback.
 *
 * @param {string} [className] Extra classes for the wrapper. Defaults to a
 *   full-viewport height (`min-h-dvh`) for the root-level navigation boundary.
 *   Pass a shorter height (e.g. `min-h-[50vh]`) when the loader renders inside
 *   a persistent shell (admin sidebar/header stays put).
 */
export function StoreLoader({ className = "min-h-dvh" }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center px-6 ${className}`}
    >
      <div className="relative flex h-52 w-52 flex-col items-center justify-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle,rgba(31,107,255,0.14),transparent_65%)]"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 120 120"
          fill="none"
          className="store-loader-ring absolute inset-0 h-full w-full text-electric"
        >
          <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="1" opacity="0.18" />
          <circle
            cx="60"
            cy="60"
            r="56"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="72 264"
            className="store-loader-arc"
          />
        </svg>

        <BrandLogoImage
          className="store-loader-mark relative h-20"
          sizes="240px"
          priority
        />

        <div className="relative mt-8 h-px w-32 overflow-hidden bg-ink/10">
          <span className="store-loader-progress absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-electric to-transparent" />
        </div>
        <span
          aria-hidden="true"
          className="store-loader-dot mt-4 h-1.5 w-1.5 rounded-full bg-electric"
        />
      </div>
    </div>
  );
}
