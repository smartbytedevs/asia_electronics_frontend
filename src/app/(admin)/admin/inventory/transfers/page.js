import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { AdminTransfers } from "./components/admin-transfers";

export const metadata = {
  title: "Stock Transfers",
};

export default async function AdminTransfersPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Stock Transfers"
        subtitle="Move stock of a product or variant between the Online and Offline locations."
      />
      <AdminTransfers />
    </div>
  );
}
