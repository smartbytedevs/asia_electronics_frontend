import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { AdminExpenses } from "./components/admin-expenses";

export const metadata = {
  title: "Expenses",
};

export default async function AdminExpensesPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Expenses"
        subtitle="Record and review business expenses. Expense records are append-only."
      />
      <AdminExpenses />
    </div>
  );
}
