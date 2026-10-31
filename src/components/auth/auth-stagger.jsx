import { cn } from "@/lib/utils";

/**
 * CSS-driven entrance stagger for the auth forms.
 *
 * `Stagger` applies the stagger animation to its direct children
 * (`auth-stagger > *`), so each `StaggerItem` fades in with an incremental
 * delay. Pure CSS = identical server/client markup (no hydration risk).
 * Reduced-motion preferences are intentionally ignored so the stagger always
 * plays.
 */
export function Stagger({ children, className }) {
  return <div className={cn("auth-stagger", className)}>{children}</div>;
}

export function StaggerItem({ children, className }) {
  return <div className={className}>{children}</div>;
}
