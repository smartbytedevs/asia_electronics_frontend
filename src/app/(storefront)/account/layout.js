import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "./_components/account-nav";

/**
 * Customer account area (storefront). Signed-in only: anonymous visitors are
 * sent to the sign-in page before any account route renders. The nav rail is
 * shared by every account page (Overview / My orders / Profile / Sign out).
 */
export const metadata = {
  title: "My Account",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[230px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
