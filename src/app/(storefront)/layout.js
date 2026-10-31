import { CartDrawer } from "./_components/cart-drawer";
import { CartProvider } from "./_components/cart-context";
import { WishlistProvider } from "./_components/wishlist-context";
import { WishlistDrawer } from "./_components/wishlist-drawer";
import { PageTransition } from "@/components/page-transition";
import { StoreFooter } from "./_components/store-footer";
import { StoreHeader } from "./_components/store-header";
import { fetchCategories } from "./lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }) {
  let categories = [];
  try {
    categories = await fetchCategories();
  } catch {
    categories = [];
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <div className="flex min-h-dvh flex-col text-ink">
          <StoreHeader categories={categories} />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <StoreFooter categories={categories} />
          <CartDrawer />
          <WishlistDrawer />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
