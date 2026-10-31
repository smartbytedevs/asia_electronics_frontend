import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  accountStatusMeta,
  userRoleMeta,
} from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";

function emailFor(customer) {
  return customer.email || "—";
}

/**
 * Desktop customer table. Columns map to the admin customer serializer
 * fields: displayName/email, role, status, phone, account creation date.
 */
export function CustomerTable({ customers, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Name</th>
              <th scope="col" className="px-4 py-3 font-medium">Email</th>
              <th scope="col" className="px-4 py-3 font-medium">Role</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Phone</th>
              <th scope="col" className="px-4 py-3 font-medium">Member since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gold-soft/20">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
                  >
                    {customer.displayName || "Customer"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-mocha-deep">{emailFor(customer)}</td>
                <td className="px-4 py-3">
                  <StatusBadge meta={userRoleMeta(customer.role)} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge meta={accountStatusMeta(customer.status)} />
                </td>
                <td className="px-4 py-3 text-muted">{customer.phone || "—"}</td>
                <td className="px-4 py-3 text-muted">{formatDate(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
