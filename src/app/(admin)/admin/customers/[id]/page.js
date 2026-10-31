import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { CustomerDetail } from "./components/customer-detail";

export const metadata = {
  title: "Customer details",
};

export default async function AdminCustomerDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <AdminPageHeader
        title="Customer details"
        subtitle="Read-only view of the application user record."
      />
      <CustomerDetail customerId={id} />
    </div>
  );
}
