import { getAdminAccess } from "@/lib/admin-auth";
import { AdminPageHeader } from "../components/admin-page-header";
import { PixelSettingsForm } from "./components/pixel-settings-form";

export const metadata = {
  title: "Pixel Settings",
};

export default async function AdminPixelSettingsPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageHeader
        title="Pixel Settings"
        subtitle="Set the Meta (Facebook) Pixel ID used to track storefront visits. Leave it empty to disable tracking."
      />
      <PixelSettingsForm />
    </div>
  );
}
