"use client";

/** Shared bolt glyph used by the auth brand lockup. */
export function BoltMark({ className = "h-10 w-10" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  );
}

/** Asia Electronics wordmark — used atop the auth card. */
export function AuthBrand() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white shadow-[0_12px_28px_-16px_rgba(8,20,46,0.9)]">
        <BoltMark className="h-5 w-5" />
      </span>
      <span className="mt-1 text-[1.05rem] font-extrabold uppercase tracking-[0.24em] text-ink">
        Asia
      </span>
      <span className="-mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-muted">
        Electronics
      </span>
    </div>
  );
}

/** Title + subtitle pair for the auth card. */
export function AuthCardHeading({ title, subtitle }) {
  return (
    <div className="mt-7 flex flex-col items-center gap-2 text-center">
      <h1 className="font-display text-2xl text-ink">{title}</h1>
      <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}
