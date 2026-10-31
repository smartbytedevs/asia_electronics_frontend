import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminPayments } from "./components/admin-payments";

export const metadata = {
  title: "Payments",
};

export default async function AdminPaymentsPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Payments"
        subtitle="Review submitted payments and verify or reject them."
      />
      <AdminPayments />
    </div>
  );
}
