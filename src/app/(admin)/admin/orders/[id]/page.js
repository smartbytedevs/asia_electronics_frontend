import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { OrderDetail } from "./components/order-detail";

export const metadata = {
  title: "Order details",
};

export default async function AdminOrderDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <AdminPageHeader
        title="Order details"
        subtitle="Review customer, payment, and item information for this order."
      />
      <OrderDetail orderId={id} />
    </div>
  );
}
