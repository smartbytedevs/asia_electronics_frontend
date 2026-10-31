import { getAdminAccess } from "@/lib/admin-auth";
import { AdminShell } from "./components/admin-shell";
import { AccessDenied } from "./components/access-denied";
import { AdminGateError } from "./components/gate-error";

export const metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }) {
  const access = await getAdminAccess();

  if (access.status === "forbidden") {
    return <AccessDenied />;
  }

  if (access.status === "error") {
    return <AdminGateError message={access.message} />;
  }

  return <AdminShell user={access.user}>{children}</AdminShell>;
}
