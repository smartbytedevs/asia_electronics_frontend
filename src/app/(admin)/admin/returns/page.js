import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminReturns } from "./components/admin-returns";

export const metadata = {
  title: "Returns",
};

export default async function AdminReturnsPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Returns"
        subtitle="Review return requests, approve or reject them, and complete approved returns."
      />
      <AdminReturns />
    </div>
  );
}
