import { getAdminAccess } from "@/lib/admin-auth";
import { AnalyticsDashboard } from "./components/analytics-dashboard";

export const metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  const { user } = access;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
          Asia Electronics
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">Dashboard</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          A quick overview of your store&apos;s performance. Welcome back,{" "}
          {user.displayName || user.email}.
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
