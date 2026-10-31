import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminRefunds } from "./components/admin-refunds";

export const metadata = {
  title: "Refunds",
};

export default async function AdminRefundsPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Refunds"
        subtitle="Process pending refunds for completed returns and void those that should not be paid out."
      />
      <AdminRefunds />
    </div>
  );
}
