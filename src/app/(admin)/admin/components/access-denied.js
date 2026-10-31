import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

/**
 * Safe 403 / unauthorized UI shown to authenticated users whose backend role
 * is not ADMIN/STAFF. Rendered from the admin layout instead of the admin
 * shell, so no admin navigation is ever exposed to unauthorized users.
 */
export function AccessDenied() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gold-soft/70 bg-cream p-8 shadow-[0_24px_60px_-32px_rgba(43,38,32,0.35)]">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
          Asia Electronics Admin
        </p>
        <h1 className="mt-3 font-display text-2xl text-ink">Access denied</h1>
        <p className="mt-2 text-sm text-muted">
          You do not have permission to access the admin area.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-mocha-deep">
          Your account is not authorized to use the Asia Electronics admin. If
          you believe this is a mistake, contact an administrator.
        </p>
        <Link
          href="/account"
          className={buttonStyles({
            size: "md",
            className:
              "mt-6 w-full border border-gold-soft bg-white text-mocha hover:bg-gold-soft/40 focus-visible:ring-gold/60",
          })}
        >
          Go to your account
        </Link>
      </div>
    </main>
  );
}
