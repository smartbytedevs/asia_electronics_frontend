import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminProducts } from "./components/admin-products";

export const metadata = {
  title: "Products",
};

export default async function AdminProductsPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Products"
        subtitle="Create and manage the products shown in the storefront. Each product needs at least one sellable variant."
      />
      <AdminProducts />
    </div>
  );
}
