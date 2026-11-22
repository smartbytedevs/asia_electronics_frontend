"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/meta-pixel";

/**
 * Fires InitiateCheckout once when the checkout view has items.
 * `total` is already in major currency units (BDT). Renders nothing.
 */
export function TrackInitiateCheckout({ items = [], total = 0 }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || items.length === 0) {
      return;
    }
    tracked.current = true;

    trackEvent("InitiateCheckout", {
      content_ids: items.map((item) => item.productId),
      contents: items.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
      })),
      num_items: items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      ),
      value: Number(total) || 0,
      currency: "BDT",
    });
  }, [items, total]);

  return null;
}
