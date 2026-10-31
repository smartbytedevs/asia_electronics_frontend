import { getAdminAccess } from "@/lib/admin-auth";
import { ApiTestExplorer } from "./components/api-test-explorer";

export const metadata = {
  title: "Admin API Testing",
};

export default async function AdminApiTestPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">API Testing</h1>
        <p className="text-sm text-zinc-600">
          Read-only probes against the Asia Electronics backend through the authenticated
          proxy. Run an endpoint to see the exact HTTP status and JSON envelope
          the backend returns.
        </p>
      </div>

      <ApiTestExplorer />
    </div>
  );
}
