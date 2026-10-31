import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminCategories } from "./components/admin-categories";

export const metadata = {
  title: "Categories",
};

export default async function AdminCategoriesPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Categories"
        subtitle="Organise the catalog. Categories appear in the storefront navigation, so keep names short and clear."
      />
      <AdminCategories />
    </div>
  );
}
