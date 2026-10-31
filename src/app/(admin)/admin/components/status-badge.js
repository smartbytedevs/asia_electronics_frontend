/**
 * Small status pill. `meta` comes from orderStatusMeta/paymentStatusMeta so the
 * badge colors are the single source of truth for status presentation.
 */
export function StatusBadge({ meta }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
