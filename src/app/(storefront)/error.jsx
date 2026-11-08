"use client";

import { EmptyState } from "./_components/empty-state";

/**
 * Storefront error boundary. Server-rendered catalog pages throw when the
 * backend is unavailable so visitors see an explicit, retryable outage state
 * instead of an empty or curated catalog that looks real.
 */
export default function StorefrontError({ reset }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <EmptyState
        title="Catalog is temporarily unavailable"
        description="We couldn't load the storefront right now. Please try again in a moment."
      />
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
