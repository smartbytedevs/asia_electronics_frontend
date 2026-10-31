"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buttonStyles } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={buttonStyles({ variant: "outline", size: "sm" })}
    >
      Sign out
    </button>
  );
}
