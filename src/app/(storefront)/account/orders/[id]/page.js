import { OrderDetail } from "../../_components/order-detail";

export const metadata = {
  title: "Order details",
};

/**
 * Order details (server shell). The order id is passed to the client
 * `OrderDetail` component, which fetches `GET /orders/:id` (customer-scoped).
 * Auth is enforced by the account layout's session gate.
 */
export default async function AccountOrderDetailPage({ params }) {
  const { id } = await params;

  return (
    <section>
      <OrderDetail orderId={id} />
    </section>
  );
}
