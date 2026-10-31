import Link from "next/link";

/**
 * Empty / unavailable state for grids that couldn't be populated (empty
 * catalog, backend down, category with no products).
 */
export function EmptyState({
  title = "Nothing here yet",
  description = "New products are being added — check back soon.",
  actionHref,
  actionLabel,
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-ivory px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-soft text-xl text-electric" aria-hidden="true">
        ⚡
      </span>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-electric"
        >
          {actionLabel ?? "Browse the catalog"}
        </Link>
      ) : null}
    </div>
  );
}
