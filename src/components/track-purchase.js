"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/meta-pixel";

const STORAGE_PREFIX = "meta.pixel.purchase.v1:";

/**
 * Fires Purchase once for a confirmed order. The order id is remembered in
 * sessionStorage so a refresh cannot double-count. Renders nothing.
 */
export function TrackPurchase({ order }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !order) {
      return;
    }
    const orderId = order.id ?? order.orderNumber;
    if (!orderId) {
      return;
    }

    let alreadyTracked = false;
    try {
      const key = `${STORAGE_PREFIX}${orderId}`;
      alreadyTracked = window.sessionStorage.getItem(key) === "1";
      if (!alreadyTracked) {
        window.sessionStorage.setItem(key, "1");
      }
    } catch {
      // Blocked storage must not suppress a valid purchase event.
    }
    if (alreadyTracked) {
      return;
    }
    tracked.current = true;

    const items = Array.isArray(order.items) ? order.items : [];
    trackEvent("Purchase", {
      content_ids: items.map((item) => item.productId),
      contents: items.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
      })),
      num_items: items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      ),
      value: Number(order.totals?.grandTotalMinorUnits ?? 0) / 100,
      currency: "BDT",
    });
  }, [order]);

  return null;
}
