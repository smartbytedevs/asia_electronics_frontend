import { cn } from "@/lib/utils";

/**
 * The authentication card — white, generous padding, subtle border, soft
 * shadow. Entrance is a plain CSS rise (hydration-safe). Reduced-motion
 * preferences are intentionally ignored so it always plays.
 */
export function AuthCard({ children, className }) {
  return (
    <div
      className={cn(
        "auth-rise w-full max-w-md rounded-3xl border border-gold-soft/70 bg-white/95 px-6 py-9 shadow-[0_24px_60px_-32px_rgba(43,38,32,0.35)] sm:px-10",
        className,
      )}
      style={{ animationDelay: "0.12s" }}
    >
      {children}
    </div>
  );
}
