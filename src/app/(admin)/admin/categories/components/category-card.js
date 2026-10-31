import { Ban, Pencil, Tags } from "lucide-react";
import { formatDate } from "@/lib/utils";

function preview(text, max = 80) {
  const value = text || "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

const editButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gold/50 bg-gold-soft/30 px-3 text-sm font-medium text-mocha-deep transition-colors hover:border-gold hover:bg-gold-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const deactivateButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-[#c9604d] transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2";

/**
 * Mobile category card — the same fields as the desktop table, laid out for
 * small screens. No raw database IDs are shown, only names, slugs, and the
 * category image.
 */
export function CategoryCard({ category, onEdit, onDeactivate }) {
  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4 shadow-[0_2px_14px_-16px_rgba(43,38,32,0.35)] transition-colors hover:border-gold-soft">
      <div className="flex items-start gap-3">
        {category.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl border border-gold-soft/60 object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gold-soft/60 bg-sand/60 text-muted">
            <Tags aria-hidden="true" className="h-5 w-5" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-ink">{category.name}</p>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
              Active
            </span>
          </div>
          <p className="truncate text-xs tabular-nums text-muted">
            /{category.slug}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-mocha-deep">
        {preview(category.description)}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Sort</dt>
          <dd className="text-ink">{category.sortOrder}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Created</dt>
          <dd className="text-ink">{formatDate(category.createdAt)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-gold-soft/40 pt-3">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className={editButtonClass}
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDeactivate(category)}
          className={deactivateButtonClass}
        >
          <Ban aria-hidden="true" className="h-4 w-4" />
          Deactivate
        </button>
      </div>
    </article>
  );
}
