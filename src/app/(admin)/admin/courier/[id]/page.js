import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { ShipmentDetail } from "./components/shipment-detail";

export const metadata = {
  title: "Shipment details",
};

export default async function AdminShipmentDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Shipment details"
        subtitle="Full courier delivery record — submissions, provider status and cancellation audit."
      />
      <ShipmentDetail shipmentId={id} />
    </div>
  );
}
