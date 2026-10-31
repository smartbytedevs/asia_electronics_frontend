import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminReviews } from "./components/admin-reviews";

export const metadata = {
  title: "Reviews",
};

export default async function AdminReviewsPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Reviews"
        subtitle="Moderate customer product reviews. Pending reviews are not visible to the public until approved."
      />
      <AdminReviews />
    </div>
  );
}
