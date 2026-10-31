import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { ReviewDetail } from "./components/review-detail";

export const metadata = {
  title: "Review details",
};

export default async function AdminReviewDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <AdminPageHeader
        title="Review details"
        subtitle="Review the full submission and approve or reject it."
      />
      <ReviewDetail reviewId={id} />
    </div>
  );
}
