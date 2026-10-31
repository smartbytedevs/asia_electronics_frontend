"use client";

import { createContext, useContext } from "react";

/**
 * Lets the mobile slide-over drawer close itself when a navigation link is
 * clicked. The drawer (client) provides a close handler via this context; nav
 * links (client) consume it. This avoids passing functions through the
 * server/client component boundary.
 */
export const AdminNavContext = createContext(null);

export function useAdminNav() {
  return useContext(AdminNavContext);
}
