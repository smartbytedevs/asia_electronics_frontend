import { StoreLoader } from "@/components/store-loader";

/**
 * The site's single, global navigation loading boundary.
 *
 * This file sits above every route-group layout (storefront, dashboard,
 * admin), so while any destination streams it replaces the ENTIRE viewport —
 * header, content and footer included. No nested loading.js exists below it
 * for the storefront, which is what keeps the persistent header/footer
 * behaviour predictable during navigation.
 *
 * Uses the site-wide StoreLoader (bolt tile + electric ring) so every loading
 * state shares one consistent brand language.
 */
export default function Loading() {
  return <StoreLoader />;
}
