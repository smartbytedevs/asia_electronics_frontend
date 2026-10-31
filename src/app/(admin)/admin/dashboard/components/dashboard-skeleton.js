/**
 * Loading skeleton for the analytics dashboard. Mirrors the real layout
 * (controls + KPI grid + two panels) and reserves the same space so there is
 * no layout jump while analytics stream in. Uses the shared shimmer sweep
 * instead of `animate-pulse` for a calmer, more polished feel.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex flex-wrap items-center gap-2">
        {["Today", "Last 7 days", "Last 30 days", "Custom"].map((label) => (
          <div
            key={label}
            className="h-8 w-28 rounded-full border border-gold-soft/50 skeleton-shimmer"
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gold-soft/50 p-5 skeleton-shimmer"
          >
            <div className="h-3 w-20 rounded-full bg-white/60" />
            <div className="mt-4 h-8 w-24 rounded-lg bg-white/70" />
            <div className="mt-3 h-3 w-28 rounded-full bg-white/50" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-gold-soft/50 p-6 skeleton-shimmer">
          <div className="h-5 w-28 rounded-lg bg-white/60" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="h-3 w-full rounded-full bg-white/50" />
                <div className="mt-2 h-2 w-full rounded-full bg-white/60" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gold-soft/50 p-6 skeleton-shimmer">
          <div className="h-5 w-32 rounded-lg bg-white/60" />
          <div className="mt-6 h-48 rounded-xl bg-white/50" />
        </div>
      </div>
    </div>
  );
}
