/**
 * Skeleton shown while the customer orders list is loading.
 */
export function OrdersSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-sand"
        />
      ))}
    </div>
  );
}
