"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends a Meta Pixel PageView after client-side route changes.
 *
 * The initial PageView is sent by the base code in the root layout, so the
 * first render is skipped here to avoid double counting.
 */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === initialPathname.current) {
      return;
    }
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
