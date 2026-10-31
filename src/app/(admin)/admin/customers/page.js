import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminCustomers } from "./components/admin-customers";

export const metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Customers"
        subtitle="Read-only view of the application user base. Filter by role and account status; details link to the full account record."
      />
      <AdminCustomers />
    </div>
  );
}
