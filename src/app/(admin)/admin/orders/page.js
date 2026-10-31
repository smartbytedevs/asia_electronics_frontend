import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminOrders } from "./components/admin-orders";

export const metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Orders"
        subtitle="Manage customer orders, payments, and order status."
      />
      <AdminOrders />
    </div>
  );
}
