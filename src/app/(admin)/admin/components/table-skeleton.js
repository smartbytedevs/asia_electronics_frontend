/**
 * Quiet loading skeleton for admin list tables. Renders placeholder rows that
 * pulse gently (CSS only, no motion library needed).
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-gold-soft/70 bg-cream p-4 sm:p-6"
    >
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-3 w-1/4 animate-pulse rounded-full bg-sand" />
            <div className="h-3 w-1/5 animate-pulse rounded-full bg-sand" />
            <div className="ml-auto h-3 w-16 animate-pulse rounded-full bg-sand" />
          </div>
        ))}
      </div>
    </div>
  );
}
