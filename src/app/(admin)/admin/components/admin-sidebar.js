import { AdminNav } from "./admin-nav";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

/**
 * Shared admin sidebar: used both as the fixed desktop rail (positioned by
 * AdminShell) and inside the mobile slide-over drawer (positioned by
 * AdminMobileMenu). It fills its parent's height and scrolls its nav
 * independently while keeping the brand and user block pinned.
 */
export function AdminSidebar({ user, className }) {
  return (
    <aside className={cn("flex h-full flex-col bg-cream/95", className)}>
      <div className="flex h-16 shrink-0 items-center border-b border-gold-soft/70 px-5">
        <BrandLogo href="/admin" imgClassName="h-11" sizes="140px" />
      </div>

      <div className="flex-1 overflow-y-auto py-5">
        <AdminNav />
      </div>

      <div className="shrink-0 border-t border-gold-soft/70 px-5 py-3.5">
        <p className="truncate text-sm font-medium text-ink">
          {user.displayName || user.email}
        </p>
        <p className="truncate text-xs text-muted">{user.role}</p>
      </div>
    </aside>
  );
}
