import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../../components/admin-page-header";
import { ProductForm } from "../../components/product-form";

export const metadata = {
  title: "Edit product",
};

export default async function AdminEditProductPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <AdminPageHeader
        title="Edit product"
        subtitle="Update the product details. Saving replaces the variant set with the list below — variants you remove are deactivated, not deleted."
      />
      <ProductForm productId={id} userRole={access.user?.role} />
    </div>
  );
}
