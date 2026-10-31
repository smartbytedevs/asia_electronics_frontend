"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/profile", label: "Profile" },
];

/**
 * Account navigation rail. Sticky on desktop, a horizontal pill strip on
 * mobile. Sign out uses the same Better Auth flow as the dashboard's logout.
 */
export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(item) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-32 lg:self-start">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.35em] text-gold">
        My account
      </p>
      <ul className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 lg:rounded-xl",
                  active
                    ? "bg-ink font-medium text-cream"
                    : "text-mocha hover:bg-sand",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="lg:mt-2 lg:border-t lg:border-sand lg:pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full whitespace-nowrap rounded-full px-5 py-2.5 text-left text-sm text-muted transition-colors hover:text-[#c9604d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 lg:rounded-xl lg:hover:bg-red-50/60"
          >
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
