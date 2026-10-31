import { CustomerOrders } from "../_components/customer-orders";

export const metadata = {
  title: "My orders",
};

/**
 * My orders (server shell). The interactive list lives in the client
 * `CustomerOrders` component so pagination, refresh, skeletons and error
 * retry all run without a full page reload. Auth is enforced by the account
 * layout's session gate.
 */
export default function AccountOrdersPage() {
  return (
    <section>
      <header>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
          My orders
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          Orders
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Every order placed on your account, newest first. Select an order to
          review its items, delivery and status.
        </p>
      </header>

      <div className="mt-10">
        <CustomerOrders />
      </div>
    </section>
  );
}
