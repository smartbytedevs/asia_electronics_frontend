import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminCourier } from "./components/admin-courier";

export const metadata = {
  title: "Courier shipments",
};

export default async function AdminCourierPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Courier shipments"
        subtitle="Track deliveries and manage courier dispatch, retries and cancellations."
      />
      <AdminCourier />
    </div>
  );
}
