import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { ProductForm } from "../components/product-form";

export const metadata = {
  title: "New product",
};

export default async function AdminNewProductPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <AdminPageHeader
        title="New product"
        subtitle="Add a product to the storefront. It needs a name, a category, and a selling price — variants and images are optional."
      />
      <ProductForm userRole={access.user?.role} />
    </div>
  );
}
