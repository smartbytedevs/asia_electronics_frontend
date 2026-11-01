import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { BrandLogo } from "./brand";
import { CartButton } from "./cart-button";
import { MobileMenu } from "./mobile-menu";
import { SearchBar } from "./search-bar";
import { BoltIcon, ShieldIcon, TruckIcon, UserIcon } from "./icons";
import { WishlistButton } from "./wishlist-button";

const FALLBACK_NAV = [
  { name: "All products", href: "/collection" },
  { name: "New arrivals", href: "/collection?sort=newest" },
  { name: "Best deals", href: "/#deals" },
  { name: "Speakers", href: "/collection" },
  { name: "Torch & lights", href: "/collection" },
  { name: "Accessories", href: "/collection" },
];

/**
 * Storefront header: announcement bar, brand + search + utilities, and a
 * category nav strip. Server-rendered; interactive pieces (search, cart,
 * mobile menu) are small client islands.
 */
export async function StoreHeader({ categories }) {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    session = null;
  }

  const accountHref = session?.user ? "/account" : "/login";
  const accountLabel = session?.user ? "Account" : "Sign in";

  const liveCategories = categories.slice(0, 7).map((category) => ({
    name: category.name,
    href: `/categories/${category.slug}`,
  }));
  const navItems =
    liveCategories.length > 0
      ? [{ name: "All products", href: "/collection" }, ...liveCategories]
      : FALLBACK_NAV;

  return (
    <header className="sticky top-0 z-30 bg-white/95 shadow-[0_10px_30px_-24px_rgba(8,20,46,0.5)] backdrop-blur-xl">
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-6 gap-y-1 px-4 py-2 text-center sm:justify-between sm:px-6">
          <p className="text-[0.66rem] font-medium tracking-[0.04em] text-white/85 sm:tracking-[0.14em]">
            <span className="font-semibold text-white">Free delivery</span> on orders over ৳5,000
          </p>
          <p className="hidden items-center gap-4 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-white/55 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <ShieldIcon className="h-3.5 w-3.5 text-electric" />
              Official warranty
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BoltIcon className="h-3.5 w-3.5 text-electric" />
              Cash on delivery
            </span>
          </p>
        </div>
      </div>

      <div className="border-b border-ink/[0.07]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6 lg:gap-6">
          <div className="flex items-center gap-1.5">
            <MobileMenu
              categories={categories}
              accountHref={accountHref}
              accountLabel={accountLabel}
            />
            <BrandLogo priority />
          </div>

          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <SearchBar variant="bar" className="w-full max-w-xl" />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <div className="md:hidden">
              <SearchBar />
            </div>
            <Link
              href="/track-order"
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 xl:inline-flex"
            >
              <TruckIcon className="h-5 w-5" />
              Track order
            </Link>
            <Link
              href={accountHref}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 md:inline-flex"
            >
              <UserIcon className="h-5 w-5" />
              <span className="hidden lg:inline">{accountLabel}</span>
            </Link>
            <div className="hidden md:block">
              <WishlistButton />
            </div>
            <CartButton />
          </div>
        </div>
      </div>

      <nav aria-label="Shop" className="hidden border-b border-ink/[0.07] lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group relative py-3 text-[0.82rem] font-medium text-ink/80 transition-colors hover:text-ink"
            >
              {item.name}
              <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-electric transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
          <Link
            href="/#deals"
            className="ml-auto inline-flex items-center gap-1.5 py-3 text-[0.82rem] font-semibold text-electric transition-colors hover:text-electric-deep"
          >
            <BoltIcon className="h-3.5 w-3.5" />
            Today&apos;s deals
          </Link>
        </div>
      </nav>
    </header>
  );
}
