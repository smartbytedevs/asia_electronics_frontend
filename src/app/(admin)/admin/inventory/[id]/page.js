import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { InventoryDetail } from "./components/inventory-detail";

export const metadata = {
  title: "Inventory details",
};

export default async function AdminInventoryDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Inventory details"
        subtitle="Stock levels, availability and the movement ledger for one variant."
      />
      <InventoryDetail variantId={id} />
    </div>
  );
}
