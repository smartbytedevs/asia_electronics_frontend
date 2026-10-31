import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { NotificationDetail } from "./components/notification-detail";

export const metadata = {
  title: "Notification details",
};

export default async function AdminNotificationDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <AdminPageHeader
        title="Notification details"
        subtitle="Read-only delivery record of one transactional email."
      />
      <NotificationDetail notificationId={id} />
    </div>
  );
}
