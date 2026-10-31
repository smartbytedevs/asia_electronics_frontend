import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../../components/admin-page-header";
import { ExpenseDetail } from "./components/expense-detail";

export const metadata = {
  title: "Expense details",
};

export default async function AdminExpenseDetailPage({ params }) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Expense details"
        subtitle="Permanent record of a business expense. Expense records cannot be edited or deleted."
      />
      <ExpenseDetail expenseId={id} />
    </div>
  );
}
