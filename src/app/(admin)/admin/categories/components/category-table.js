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

const activeBadgeClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700";

/**
 * Desktop categories table. Columns map to the backend category serializer:
 * name + slug + image + status, description, sortOrder, createdAt, and
 * edit/deactivate actions. The backend list is ACTIVE-only, so every row shown
 * is active. No raw database IDs are displayed.
 */
export function CategoryTable({ categories, onEdit, onDeactivate, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream shadow-[0_2px_18px_-16px_rgba(43,38,32,0.35)] ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Category</th>
              <th scope="col" className="px-4 py-3 font-medium">Description</th>
              <th scope="col" className="px-4 py-3 font-medium">Sort</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {categories.map((category) => (
              <tr key={category.id} className="transition-colors hover:bg-gold-soft/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {category.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.image}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg border border-gold-soft/60 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold-soft/60 bg-sand/60 text-muted">
                        <Tags aria-hidden="true" className="h-4 w-4" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink">
                          {category.name}
                        </span>
                        <span className={activeBadgeClass}>
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                          Active
                        </span>
                      </div>
                      <p className="truncate text-xs tabular-nums text-muted">
                        /{category.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="max-w-xs px-4 py-3 text-muted">
                  {preview(category.description)}
                </td>
                <td className="px-4 py-3 tabular-nums text-mocha-deep">
                  {category.sortOrder}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(category.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
