import { Suspense } from "react";
import { headers } from "next/headers";
import { CartDrawer } from "./_components/cart-drawer";
import { CartProvider } from "./_components/cart-context";
import { WishlistProvider } from "./_components/wishlist-context";
import { WishlistDrawer } from "./_components/wishlist-drawer";
import { PageTransition } from "@/components/page-transition";
import { FloatingContact } from "./_components/floating-contact";
import { StoreFooter } from "./_components/store-footer";
import { StoreHeader } from "./_components/store-header";
import { auth } from "@/lib/auth";
import { fetchCategories } from "./lib/catalog-data";

export const dynamic = "force-dynamic";

async function getStoreSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

async function StoreHeaderWithData() {
  const [categories, session] = await Promise.all([
    fetchCategories().catch(() => []),
    getStoreSession(),
  ]);
  return <StoreHeader categories={categories} session={session} />;
}

async function StoreFooterWithData() {
  const categories = await fetchCategories().catch(() => []);
  return <StoreFooter categories={categories} />;
}

export default function StorefrontLayout({ children }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="flex min-h-dvh flex-col text-ink">
          <Suspense fallback={<StoreHeader categories={[]} session={null} />}>
            <StoreHeaderWithData />
          </Suspense>
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Suspense fallback={<StoreFooter categories={[]} />}>
            <StoreFooterWithData />
          </Suspense>
          <FloatingContact />
          <CartDrawer />
          <WishlistDrawer />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
