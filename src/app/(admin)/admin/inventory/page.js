import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminInventory } from "./components/admin-inventory";

export const metadata = {
  title: "Inventory",
};

export default async function AdminInventoryPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Inventory"
        subtitle="Stock levels, availability and low-stock state for products and variants."
      />
      <AdminInventory />
    </div>
  );
}
