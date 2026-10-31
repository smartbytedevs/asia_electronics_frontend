import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  BackendAccessTokenError,
  getBackendAccessToken,
} from "@/lib/backend-auth";
import { apiClient, ApiClientError } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export const metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

const TOKEN_ERROR_MESSAGE =
  "We could not obtain a backend access token from your session. Please sign out and sign in again.";

function backendErrorMessage(err) {
  if (err instanceof BackendAccessTokenError) {
    return TOKEN_ERROR_MESSAGE;
  }
  if (err instanceof ApiClientError) {
    // ApiClientError messages are safe, pre-mapped, user-facing strings.
    return err.message;
  }
  return "Something went wrong while contacting the backend. Please try again later.";
}

function UserField({ label, value }) {
  return (
    <div>
      <dt className="font-medium text-zinc-500">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

export default async function DashboardPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  let backendUser = null;
  let backendError = null;

  try {
    const token = await getBackendAccessToken({ headers: requestHeaders });
    const response = await apiClient.get("/me", { token });
    backendUser = response?.data?.user ?? null;
  } catch (err) {
    backendError = backendErrorMessage(err);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Better Auth session</CardTitle>
            <CardDescription>
              Signed in as {session.user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <dl className="space-y-3">
              <UserField label="Name" value={session.user.name} />
              <UserField
                label="Better Auth user ID"
                value={
                  <span className="font-mono text-xs">{session.user.id}</span>
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend account</CardTitle>
            <CardDescription>
              Your application user record from GET /api/v1/me
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {backendError ? (
              <p role="alert" className="text-sm text-red-600">
                {backendError}
              </p>
            ) : backendUser ? (
              <dl className="space-y-3">
                <UserField label="Role" value={backendUser.role} />
                <UserField label="Status" value={backendUser.status} />
                {backendUser.displayName ? (
                  <UserField
                    label="Display name"
                    value={backendUser.displayName}
                  />
                ) : null}
                {backendUser.email ? (
                  <UserField label="Email" value={backendUser.email} />
                ) : null}
                <UserField
                  label="Backend user ID"
                  value={
                    <span className="font-mono text-xs">{backendUser.id}</span>
                  }
                />
              </dl>
            ) : (
              <p className="text-sm text-zinc-600">
                No backend account information available.
              </p>
            )}
          </CardContent>
        </Card>

        <LogoutButton />
      </div>
    </main>
  );
}
