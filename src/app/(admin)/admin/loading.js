import { StoreLoader } from "@/components/store-loader";

/**
 * Admin route loading state, rendered inside the persistent admin shell
 * (sidebar and header stay put) while the destination admin page streams. Uses
 * the same Asia Electronics brand language as the rest of the site.
 */
export default function AdminLoading() {
  return <StoreLoader className="min-h-[50vh]" />;
}
