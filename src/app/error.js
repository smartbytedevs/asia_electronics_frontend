"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-zinc-600">
        An unexpected error occurred while rendering this page.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
