"use client";

import { BoltMark } from "./auth-brand";

/**
 * Responsive layout for the authentication experience.
 *
 * Desktop: two-column composition — an Asia Electronics brand panel on the
 * left, the authentication card on the right. Tablet / mobile: single column;
 * the brand panel is hidden and the card carries the wordmark in its header.
 *
 * Entrance animation is a plain CSS fade (hydration-safe).
 */
export function AuthShell({ children }) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-ivory">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(31,107,255,0.12),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(8,20,46,0.08),transparent_50%)]"
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-12 px-5 py-12 sm:px-8 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:px-12 lg:py-16">
          <BrandPanel />
          <div className="flex w-full flex-col items-center">{children}</div>
        </div>
      </div>
    </main>
  );
}

function BrandPanel() {
  return (
    <aside className="auth-fade hidden lg:flex lg:flex-col lg:items-center lg:text-center">
      <div className="relative mb-10 flex h-44 w-44 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-electric/20" />
        <div className="absolute inset-4 rounded-full border border-dashed border-ink/10" />
        <div className="absolute inset-8 rounded-full bg-white shadow-[0_26px_60px_-30px_rgba(8,20,46,0.55)]" />
        <BoltMark className="relative h-14 w-14 text-electric" />
      </div>

      <span className="text-[0.66rem] font-semibold uppercase tracking-[0.42em] text-electric">
        Asia Electronics
      </span>
      <h1 className="mt-5 max-w-md font-display text-4xl leading-tight text-ink">
        Genuine tech, better everyday.
      </h1>
      <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-muted">
        Sign in to track orders, save your favourite products and check out
        faster — with official warranty and expert support at every step.
      </p>
    </aside>
  );
}
