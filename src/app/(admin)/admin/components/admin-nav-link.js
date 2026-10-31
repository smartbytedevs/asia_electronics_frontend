"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  BadgeDollarSign,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  Tags,
  Truck,
  Undo2,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminNav } from "./admin-nav-context";

const ICONS = {
  dashboard: LayoutDashboard,
  products: Package,
  categories: Tags,
  inventory: Warehouse,
  reservations: CalendarClock,
  transfers: ArrowRightLeft,
  orders: ShoppingBag,
  payments: CreditCard,
  expenses: Wallet,
  customers: Users,
  reviews: Star,
  returns: Undo2,
  refunds: BadgeDollarSign,
  courier: Truck,
};

export function AdminNavLink({ href, icon, children }) {
  const pathname = usePathname();
  const closeNav = useAdminNav();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = ICONS[icon];

  return (
    <Link
      href={href}
      onClick={() => closeNav?.()}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-gold-soft/60 text-mocha-deep"
          : "text-muted hover:bg-gold-soft/30 hover:text-ink",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold transition-opacity",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
        )}
      />
      <Icon
        aria-hidden="true"
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active
            ? "text-gold"
            : "text-mocha/60 group-hover:text-mocha-deep",
        )}
      />
      <span className="truncate">{children}</span>
    </Link>
  );
}
