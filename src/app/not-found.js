import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-emerald-600">404</p>
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="max-w-md text-sm text-zinc-600">
        The page you are looking for does not exist.
      </p>
      <Link href="/" className={buttonStyles({ variant: "outline", size: "sm" })}>
        Back to home
      </Link>
    </main>
  );
}
