import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { AdminReservations } from "./components/admin-reservations";

export const metadata = {
  title: "Reservations",
};

export default async function AdminReservationsPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Reservations"
        subtitle="Held portions of online stock, organized by product, with create, release, consume and expire controls."
      />
      <AdminReservations />
    </div>
  );
}
