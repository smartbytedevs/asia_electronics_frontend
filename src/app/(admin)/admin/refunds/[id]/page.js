import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { RefundDetail } from "./components/refund-detail";

export const metadata = {
  title: "Refund details",
};

export default async function AdminRefundDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Refund details"
        subtitle="The financial record for a completed return — payout, method and audit trail."
      />
      <RefundDetail refundId={id} />
    </div>
  );
}
