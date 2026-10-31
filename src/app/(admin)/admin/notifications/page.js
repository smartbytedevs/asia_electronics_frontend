import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminNotifications } from "./components/admin-notifications";

export const metadata = {
  title: "Notifications",
};

export default async function AdminNotificationsPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Notifications"
        subtitle="Keep up with what's happening in the store — new orders and customer reviews arrive here automatically. Open a notification to jump straight to the related order or review."
      />
      <AdminNotifications />
    </div>
  );
}
