import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { ReturnDetail } from "./components/return-detail";

export const metadata = {
  title: "Return details",
};

export default async function AdminReturnDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Return details"
        subtitle="The full return request, its items and moderation history."
      />
      <ReturnDetail returnId={id} />
    </div>
  );
}
