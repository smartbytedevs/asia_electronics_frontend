/**
 * Tiny inline spinner for button loading states. Rotates via CSS animation.
 */
export function InlineSpinner({ className = "h-4 w-4 border-2" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent align-middle ${className}`}
    />
  );
}
