import { AdminMobileMenu } from "./admin-mobile-menu";
import { AdminSidebar } from "./admin-sidebar";
import { AdminLogoutButton } from "./admin-logout-button";
import { AdminNotificationBell } from "./admin-notification-bell";

function initialsOf(value) {
  return (value || "A")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function AdminHeader({ user }) {
  const name = user.displayName || user.email;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-gold-soft/70 bg-cream/95 px-4 shadow-[0_1px_0_rgba(184,155,107,0.1),0_2px_14px_-10px_rgba(43,38,32,0.18)] sm:gap-3 sm:px-6 lg:px-8">
      <AdminMobileMenu>
        <AdminSidebar user={user} />
      </AdminMobileMenu>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden="true"
          className="hidden h-9 w-9 shrink-0 select-none items-center justify-center rounded-full border border-gold/40 bg-gold-soft/40 font-display text-sm font-semibold text-mocha-deep shadow-[inset_0_0_0_1px_rgba(184,155,107,0.25)] sm:flex"
        >
          {initialsOf(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-ink">
            {name}
          </p>
          <p className="mt-0.5 truncate text-xs leading-tight text-muted">
            {user.email}
          </p>
        </div>
      </div>

      <span className="hidden items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft/30 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-mocha-deep sm:inline-flex">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
        {user.role}
      </span>

      <AdminNotificationBell />
      <AdminLogoutButton />
    </header>
  );
}
