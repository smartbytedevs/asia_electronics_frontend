import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { PageTransition } from "@/components/page-transition";

/**
 * Server-rendered admin shell.
 *
 * Desktop: a fixed, full-height sidebar rail on the left with the content
 * column offset to the right, and a sticky header that stays on top while
 * scrolling. Mobile: the sidebar is hidden and the header's menu button opens
 * the same sidebar in a slide-over drawer. No element overlaps another — the
 * header lives in the content column at the same layer (z-40) as the fixed
 * sidebar, so the sidebar never covers it, and the drawer (z-50) sits above
 * everything on small screens.
 */
export function AdminShell({ user, children }) {
  return (
    <div className="admin-damask min-h-screen">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <AdminSidebar
          user={user}
          className="border-r border-gold-soft/70 shadow-[2px_0_24px_-18px_rgba(43,38,32,0.5)]"
        />
      </div>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <AdminHeader user={user} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
