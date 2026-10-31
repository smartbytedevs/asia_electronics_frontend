import { OrderTracker } from "../_components/order-tracker";
import { absoluteUrl } from "@/lib/seo";

export const metadata = {
  title: "Track your order",
  description:
    "Track your Asia Electronics order with your order number and phone — from confirmation to delivery.",
  alternates: {
    canonical: absoluteUrl("/track-order"),
  },
};

/**
 * Guest order tracker page. The public `GET /orders/status` contract needs no
 * account, so any visitor can look up an order by its number + delivery phone.
 */
export default function TrackOrderPage() {
  return <OrderTracker />;
}
