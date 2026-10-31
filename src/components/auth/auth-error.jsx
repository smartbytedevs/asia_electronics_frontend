function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 15.5h.01" />
    </svg>
  );
}

/**
 * Elegant inline error container. Only safe, user-facing messages are passed
 * in by the pages — never raw stack traces. Appears with the shared CSS rise
 * animation; reduced-motion preferences are intentionally ignored.
 */
export function AuthError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="auth-rise flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-3.5 py-3 text-sm leading-snug text-red-700"
      style={{ animationDelay: "0.05s" }}
    >
      <AlertIcon />
      <p>{message}</p>
    </div>
  );
}
