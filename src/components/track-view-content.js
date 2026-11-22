"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/meta-pixel";

/**
 * Fires ViewContent once per product detail view. Renders nothing.
 * `price` is already in major currency units (BDT).
 */
export function TrackViewContent({ productId, productName, price }) {
  const lastTrackedId = useRef(null);

  useEffect(() => {
    if (!productId || lastTrackedId.current === productId) {
      return;
    }
    lastTrackedId.current = productId;

    trackEvent("ViewContent", {
      content_ids: [productId],
      content_name: productName,
      content_type: "product",
      value: Number(price) || 0,
      currency: "BDT",
    });
  }, [productId, productName, price]);

  return null;
}
