"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={handleLogout}
      aria-label="Sign out"
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-mocha/25 bg-white px-3 text-sm font-semibold text-mocha-deep shadow-sm transition-colors hover:border-mocha hover:bg-mocha hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 sm:px-4"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      <span className="hidden sm:inline">Sign out</span>
    </motion.button>
  );
}
