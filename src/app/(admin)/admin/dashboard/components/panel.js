import { cn } from "@/lib/utils";

/**
 * ABAYA-styled surface for the admin dashboard: cream panel, soft gold border,
 * generous padding. Kept separate from the zinc `ui/card` primitive so the
 * dashboard palette stays deterministic. Hover gently warms the border and
 * deepens the shadow. `min-w-0` lets the panel shrink inside grid/flex columns
 * on small screens instead of forcing horizontal overflow.
 */
export function Panel({ className, ...props }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-gold-soft/70 bg-gradient-to-b from-cream to-white p-5 shadow-[0_16px_40px_-28px_rgba(43,38,32,0.28)] transition-all duration-300 hover:border-gold/50 hover:shadow-[0_22px_48px_-26px_rgba(43,38,32,0.36)] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

/** Serif section heading used inside dashboard panels. */
export function PanelTitle({ children }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg text-ink">
      <span
        aria-hidden="true"
        className="h-4 w-1 rounded-full bg-gold"
      />
      {children}
    </h2>
  );
}
