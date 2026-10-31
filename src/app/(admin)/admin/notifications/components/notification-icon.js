import { Bell, ShoppingBag, Star } from "lucide-react";
import { notificationKind } from "./notification-utils";

/**
 * Tinted icon tile for a notification row. The tone (gold = new order,
 * amber = new review, sand = generic) comes from the notification kind so the
 * same visual language is reused in the table, mobile cards, and detail view.
 * Pass a `className` to override the default `h-9 w-9` tile size.
 */
export function NotificationIcon({ notification, className }) {
  const kind = notificationKind(notification);
  const tileClass = `flex shrink-0 items-center justify-center rounded-xl ${
    className ?? "h-9 w-9"
  } ${kind.iconClass}`;
  const innerClass = className ? "h-5 w-5" : "h-4 w-4";
  if (kind.icon === "order") {
    return (
      <span className={tileClass}>
        <ShoppingBag aria-hidden="true" className={innerClass} />
      </span>
    );
  }
  if (kind.icon === "review") {
    return (
      <span className={tileClass}>
        <Star aria-hidden="true" className={innerClass} />
      </span>
    );
  }
  return (
    <span className={tileClass}>
      <Bell aria-hidden="true" className={innerClass} />
    </span>
  );
}
