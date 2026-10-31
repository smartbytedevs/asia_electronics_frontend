/**
 * Safe error UI shown when the admin authorization boundary cannot reach the
 * backend (backend down, verification failure, unexpected error). Only the
 * pre-mapped, user-facing `message` is rendered — never raw backend bodies,
 * tokens, or stack traces.
 */
export function AdminGateError({ message }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gold-soft/70 bg-cream p-8 shadow-[0_24px_60px_-32px_rgba(43,38,32,0.35)]">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
          Asia Electronics Admin
        </p>
        <h1 className="mt-3 font-display text-2xl text-ink">Admin unavailable</h1>
        <p className="mt-2 text-sm text-muted">
          We could not verify your admin access.
        </p>
        <p role="alert" className="mt-4 text-sm leading-relaxed text-mocha-deep">
          {message}
        </p>
      </div>
    </main>
  );
}
